import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    
    // Get upcoming broadcasts (scheduled but not yet live)
    const upcomingBroadcasts = await prisma.liveBroadcast.findMany({
      where: {
        status: {
          in: ["SCHEDULED"],
        },
        startTime: {
          gte: now,
        },
      },
      include: {
        hostUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        banner: {
          select: {
            url: true,
            originalName: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 10,
    });

    const transformedBroadcasts = upcomingBroadcasts.map(broadcast => ({
      id: broadcast.id,
      title: broadcast.title,
      description: broadcast.description,
      host: broadcast.hostUser ? `${broadcast.hostUser.firstName} ${broadcast.hostUser.lastName}` : "Unknown Host",
      startTime: broadcast.startTime.toISOString(),
      duration: broadcast.endTime 
        ? Math.floor((new Date(broadcast.endTime).getTime() - new Date(broadcast.startTime).getTime()) / (1000 * 60))
        : 60, // Default 60 minutes if no end time
      banner: broadcast.banner?.url,
    }));

    return NextResponse.json({
      broadcasts: transformedBroadcasts,
    });
  } catch (error) {
    console.error("Error fetching upcoming broadcasts:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming broadcasts" },
      { status: 500 }
    );
  }
}