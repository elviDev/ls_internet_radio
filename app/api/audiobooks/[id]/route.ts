import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAudiobookSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  coverImage: z.string().url().optional(),
  genre: z.string().optional(),
  releaseDate: z.string().optional(),
  slug: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const existing = await prisma.audiobook.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Audiobook not found" }, { status: 404 });
  }

  const isAuthorized = user.role === "ADMIN" || user.id === existing.authorId;
  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (existing.status === "PUBLISHED" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Published audiobooks cannot be edited" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parse = updateAudiobookSchema.safeParse(body);

  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid data", issues: parse.error.format() },
      { status: 400 }
    );
  }

  const updated = await prisma.audiobook.update({
    where: { id },
    data: {
      ...parse.data,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    message: "Audiobook updated",
    audiobook: updated,
  });
}
