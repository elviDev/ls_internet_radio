import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { uploadToS3 } from "@/lib/storage/uploadToS3";
import { deleteFromS3 } from "@/lib/storage/deleteFromS3";
import { getAudioDuration } from "@/lib/audio/getAudioDuration";

export const PATCH = async (
  req: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) => {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: audiobookId, chapterId } = params;

    const formData = await req.formData();
    const title = formData.get("title") as string | null;
    const trackNumber = formData.get("trackNumber") as string | null;
    const isDraft = formData.get("isDraft") as string | null;
    const audioFile = formData.get("audioFile") as File | null;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        audiobook: { select: { authorId: true } },
      },
    });

    if (!chapter || chapter.audiobook.authorId !== user.id) {
      return NextResponse.json(
        { error: "Chapter not found or unauthorized" },
        { status: 404 }
      );
    }

    let updatedFields: any = {};

    if (title) updatedFields.title = title;
    if (trackNumber) updatedFields.trackNumber = parseInt(trackNumber);
    if (isDraft !== null) updatedFields.isDraft = isDraft === "true";

    if (audioFile) {
      const buffer = Buffer.from(await audioFile.arrayBuffer());
      const fileType = audioFile.type;

      const s3Path = `audiobooks/${audiobookId}/chapters`;
      const { url: newAudioUrl, key: newAudioKey } = await uploadToS3(
        buffer,
        audioFile.name,
        fileType,
        s3Path
      );

      const duration = await getAudioDuration(audioFile);

      // Delete old file
      const oldKey = chapter.audioFile.split(`${process.env.S3_BUCKET}/`)[1];
      if (oldKey) await deleteFromS3(oldKey);

      updatedFields.audioFile = newAudioUrl;
      updatedFields.duration = duration;
    }

    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: updatedFields,
    });

    return NextResponse.json(updatedChapter, { status: 200 });
  } catch (error) {
    console.error("Error updating chapter:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const chapterId = params.id;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      audiobook: true,
    },
  });

  if (!chapter) {
    return NextResponse.json({ message: "Chapter not found" }, { status: 404 });
  }

  // Authorization check: only author or admin
  if (chapter.audiobook.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // Delete the audio file from S3 if present
  const fileKey = chapter.audioFile?.split(`/${process.env.S3_BUCKET}/`)[1];
  if (fileKey) {
    await deleteFromS3(fileKey);
  }

  // Delete chapter from DB
  await prisma.chapter.delete({ where: { id: chapterId } });

  return NextResponse.json({ message: "Chapter deleted successfully" });
}
