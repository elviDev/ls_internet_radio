import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { z } from "zod";

const createBroadcastSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  hostId: z.string().min(1, "Host is required"),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  status: z.enum(["SCHEDULED", "LIVE", "ENDED"]).default("SCHEDULED"),
  streamUrl: z.string().url().optional(),
  bannerId: z.string().optional(),
  programId: z.string().optional(),
  staff: z.array(z.object({
    userId: z.string(),
    role: z.enum(["HOST", "CO_HOST", "PRODUCER", "SOUND_ENGINEER", "MODERATOR"])
  })).optional(),
  guests: z.array(z.object({
    name: z.string().min(1, "Guest name is required"),
    title: z.string().optional(),
    role: z.string().min(1, "Guest role is required")
  })).optional(),
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .substring(0, 50) + '-' + Date.now().toString(36);
}

export const GET = adminOnly(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    
    // Handle single broadcast fetch by ID
    const broadcastId = searchParams.get("id");
    const single = searchParams.get("single");
    
    if (broadcastId && single === "true") {
      const broadcast = await prisma.broadcast.findUnique({
        where: { id: broadcastId },
        include: {
          hostUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          banner: true,
          program: true,
          staff: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          guests: true,
        },
      });
      
      if (!broadcast) {
        return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
      }
      
      return NextResponse.json(broadcast);
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "10", 10);
    const status = searchParams.get("status");
    const programId = searchParams.get("programId");

    const where: any = {};
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }
    
    // Filter by program association
    if (programId === "null") {
      where.programId = null; // Only broadcasts not linked to any program
    } else if (programId && programId !== "all") {
      where.programId = programId;
    }

    const [broadcasts, total] = await Promise.all([
      prisma.liveBroadcast.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          hostUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          banner: {
            select: { id: true, url: true, originalName: true, type: true }
          },
          program: {
            select: { id: true, title: true, slug: true }
          },
          staff: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, username: true, email: true, profileImage: true }
              }
            },
            where: { isActive: true }
          },
          guests: true
        },
      }),
      prisma.liveBroadcast.count({ where }),
    ]);

    return NextResponse.json({
      broadcasts,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get broadcasts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch broadcasts" },
      { status: 500 }
    );
  }
});

export const POST = adminOnly(async (req: Request) => {
  try {
    const body = await req.json();
    const data = createBroadcastSchema.parse(body);

    // Get current user (admin)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const broadcast = await prisma.liveBroadcast.create({
      data: {
        title: data.title,
        description: data.description,
        slug: generateSlug(data.title),
        hostId: data.hostId,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        status: data.status,
        streamUrl: data.streamUrl,
        bannerId: data.bannerId,
        programId: data.programId,
      },
      include: {
        hostUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Create corresponding schedule entry
    await prisma.schedule.create({
      data: {
        title: data.title,
        description: data.description,
        type: "LIVE_BROADCAST",
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        assignedTo: data.hostId,
        createdBy: user.id,
        status: data.status === "SCHEDULED" ? "SCHEDULED" : "DRAFT",
        liveBroadcastId: broadcast.id,
        priority: 1, // High priority for live broadcasts
      },
    });

    // Create staff assignments if provided
    if (data.staff && data.staff.length > 0) {
      await prisma.broadcastStaff.createMany({
        data: data.staff.map(staffMember => ({
          broadcastId: broadcast.id,
          userId: staffMember.userId,
          role: staffMember.role,
          isActive: true,
        }))
      });
    }

    // Create guest assignments if provided
    if (data.guests && data.guests.length > 0) {
      await prisma.broadcastGuest.createMany({
        data: data.guests.map(guest => ({
          broadcastId: broadcast.id,
          name: guest.name,
          title: guest.title || null,
          role: guest.role,
        }))
      });
    }

    // Fetch the broadcast with staff and guests included
    const broadcastWithDetails = await prisma.liveBroadcast.findUnique({
      where: { id: broadcast.id },
      include: {
        hostUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        banner: {
          select: { id: true, url: true, originalName: true, type: true }
        },
        staff: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, username: true, email: true, profileImage: true }
            }
          },
          where: { isActive: true }
        },
        guests: true
      },
    });

    return NextResponse.json(broadcastWithDetails, { status: 201 });
  } catch (error) {
    console.error("Create broadcast error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create broadcast" },
      { status: 500 }
    );
  }
});