import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get the current live broadcast
    const liveBroadcast = await prisma.liveBroadcast.findFirst({
      where: {
        status: "LIVE",
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
        staff: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
        guests: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    if (!liveBroadcast) {
      return NextResponse.json(null);
    }

    // Simulate listener count (in a real app, this would come from your streaming service)
    const listenerCount = Math.floor(Math.random() * 500) + 50;

    // Simulate current track (in a real app, this would come from your streaming service)
    const currentTrack = {
      title: "Jazz Café Sessions",
      artist: "Various Artists",
      duration: 240,
      progress: Math.floor(Math.random() * 240),
    };

    const response = {
      ...liveBroadcast,
      listenerCount,
      currentTrack,
      streamUrl: process.env.STREAM_URL || "https://example-stream-url.com/live",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching live broadcast:", error);
    return NextResponse.json(
      { error: "Failed to fetch live broadcast" },
      { status: 500 }
    );
  }
}