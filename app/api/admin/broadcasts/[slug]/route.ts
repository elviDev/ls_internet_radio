import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { z } from "zod";

const updateBroadcastSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  status: z.enum(["SCHEDULED", "READY", "LIVE", "ENDED"]).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  streamUrl: z.string().url().optional(),
  bannerId: z.string().optional(),
});

export const GET = adminOnly(async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  try {
    const { slug } = await params;
    const broadcast = await prisma.liveBroadcast.findUnique({
      where: { slug },
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
            id: true,
            url: true,
            originalName: true,
            type: true,
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
          where: { isActive: true },
        },
        guests: true,
      },
    });

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    return NextResponse.json(broadcast);
  } catch (error) {
    console.error("Get broadcast error:", error);
    return NextResponse.json(
      { error: "Failed to fetch broadcast" },
      { status: 500 }
    );
  }
});

export const PATCH = adminOnly(async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  try {
    const { slug } = await params;
    const body = await req.json();
    const data = updateBroadcastSchema.parse(body);

    // Check if broadcast exists
    const existingBroadcast = await prisma.liveBroadcast.findUnique({
      where: { slug },
    });

    if (!existingBroadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    // Update broadcast
    const broadcast = await prisma.liveBroadcast.update({
      where: { slug },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.startTime && { startTime: new Date(data.startTime) }),
        ...(data.endTime && { endTime: new Date(data.endTime) }),
        ...(data.streamUrl !== undefined && { streamUrl: data.streamUrl }),
        ...(data.bannerId !== undefined && { bannerId: data.bannerId }),
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
            id: true,
            url: true,
            originalName: true,
            type: true,
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
          where: { isActive: true },
        },
        guests: true,
      },
    });

    return NextResponse.json(broadcast);
  } catch (error) {
    console.error("Update broadcast error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update broadcast" },
      { status: 500 }
    );
  }
});

export const DELETE = adminOnly(async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  try {
    const { slug } = await params;
    // Check if broadcast exists
    const existingBroadcast = await prisma.liveBroadcast.findUnique({
      where: { slug },
    });

    if (!existingBroadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    // Don't allow deletion of live broadcasts
    if (existingBroadcast.status === "LIVE") {
      return NextResponse.json(
        { error: "Cannot delete a live broadcast" },
        { status: 400 }
      );
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.broadcastStaff.deleteMany({
      where: { broadcastId: existingBroadcast.id },
    });

    await prisma.broadcastGuest.deleteMany({
      where: { broadcastId: existingBroadcast.id },
    });

    // Delete the broadcast
    await prisma.liveBroadcast.delete({
      where: { slug },
    });

    return NextResponse.json({ message: "Broadcast deleted successfully" });
  } catch (error) {
    console.error("Delete broadcast error:", error);
    return NextResponse.json(
      { error: "Failed to delete broadcast" },
      { status: 500 }
    );
  }
});