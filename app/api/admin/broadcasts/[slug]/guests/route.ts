import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { z } from "zod";

const createGuestSchema = z.object({
  name: z.string().min(1, "Guest name is required"),
  title: z.string().optional(),
  role: z.string().min(1, "Guest role is required"),
});

export const POST = adminOnly(async (req: Request, { params }: { params: { slug: string } }) => {
  try {
    const body = await req.json();
    const data = createGuestSchema.parse(body);

    // Check if broadcast exists
    const broadcast = await prisma.liveBroadcast.findUnique({
      where: { slug: params.slug },
      select: { id: true, allowGuests: true },
    });

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    if (!broadcast.allowGuests) {
      return NextResponse.json({ error: "Guests are not allowed for this broadcast" }, { status: 400 });
    }

    // Create guest
    const guest = await prisma.broadcastGuest.create({
      data: {
        broadcastId: broadcast.id,
        name: data.name,
        title: data.title || null,
        role: data.role,
      },
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    console.error("Create guest error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create guest" },
      { status: 500 }
    );
  }
});

export const GET = adminOnly(async (req: Request, { params }: { params: { slug: string } }) => {
  try {
    // Get broadcast and its guests
    const broadcast = await prisma.liveBroadcast.findUnique({
      where: { slug: params.slug },
      include: {
        guests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    return NextResponse.json({ guests: broadcast.guests });
  } catch (error) {
    console.error("Get guests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch guests" },
      { status: 500 }
    );
  }
});