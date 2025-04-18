// app/api/audiobooks/[slugOrId]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET(
  req: Request,
  { params }: { params: { slugOrId: string } }
) {
  try {
    const { slugOrId } = params;
    const { searchParams } = new URL(req.url);
    const includeChapters = searchParams.get("withChapters") === "true";

    const user = await getCurrentUser();

    // Try to find by slug or ID
    const audiobook = await prisma.audiobook.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        ...(includeChapters && {
          chapters: {
            orderBy: { trackNumber: "asc" },
            select: {
              id: true,
              title: true,
              trackNumber: true,
              duration: true,
              audioFile: true,
            },
          },
        }),
      },
    });

    if (!audiobook) {
      return NextResponse.json(
        { error: "Audiobook not found" },
        { status: 404 }
      );
    }

    const isOwner = user?.id === audiobook.authorId;
    const isAdmin = user?.role === "ADMIN";

    // If not published, check access
    if (audiobook.status !== "PUBLISHED" && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ data: audiobook });
  } catch (error) {
    console.error("Error fetching audiobook:", error);
    return NextResponse.json(
      { error: "Failed to fetch audiobook" },
      { status: 500 }
    );
  }
}
