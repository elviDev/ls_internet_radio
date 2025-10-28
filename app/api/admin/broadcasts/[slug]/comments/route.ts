import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1, "Content is required"),
});

export const GET = adminOnly(async (req: Request, { params }: { params: { slug: string } }) => {
  try {
    // First find the broadcast by slug to get its ID
    const broadcast = await prisma.liveBroadcast.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { liveBroadcastId: broadcast.id },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
});

export const POST = adminOnly(async (req: Request, { params }: { params: { slug: string } }) => {
  try {
    const body = await req.json();
    const data = createCommentSchema.parse(body);

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify broadcast exists and get its ID
    const broadcast = await prisma.liveBroadcast.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        userId: user.id,
        liveBroadcastId: broadcast.id,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
});