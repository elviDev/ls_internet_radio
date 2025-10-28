import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { z } from "zod";

const updateGuestSchema = z.object({
  name: z.string().min(1, "Guest name is required").optional(),
  title: z.string().optional(),
  role: z.string().min(1, "Guest role is required").optional(),
});

export const PATCH = adminOnly(async (req: Request, { params }: { params: { slug: string; guestId: string } }) => {
  try {
    const body = await req.json();
    const data = updateGuestSchema.parse(body);

    // Check if broadcast and guest exist
    const broadcast = await prisma.liveBroadcast.findUnique({
      where: { slug: params.slug },
      include: {
        guests: {
          where: { id: params.guestId },
        },
      },
    });

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    if (broadcast.guests.length === 0) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Update guest
    const guest = await prisma.broadcastGuest.update({
      where: { id: params.guestId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.role && { role: data.role }),
      },
    });

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Update guest error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update guest" },
      { status: 500 }
    );
  }
});

export const DELETE = adminOnly(async (req: Request, { params }: { params: { slug: string; guestId: string } }) => {
  try {
    // Check if broadcast and guest exist
    const broadcast = await prisma.liveBroadcast.findUnique({
      where: { slug: params.slug },
      include: {
        guests: {
          where: { id: params.guestId },
        },
      },
    });

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    if (broadcast.guests.length === 0) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Delete guest
    await prisma.broadcastGuest.delete({
      where: { id: params.guestId },
    });

    return NextResponse.json({ message: "Guest removed successfully" });
  } catch (error) {
    console.error("Delete guest error:", error);
    return NextResponse.json(
      { error: "Failed to remove guest" },
      { status: 500 }
    );
  }
});