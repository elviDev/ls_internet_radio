import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";
import { uploadChapterAudio } from "@/lib/uploads/audiobooks";
import { parseBuffer } from "music-metadata";
import { getAudioDuration } from "@/lib/audio/getAudioDuration";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const audioFile = formData.get("audio") as File;
  const title = formData.get("title") as string;
  const trackNumber = parseInt(formData.get("trackNumber") as string);

  if (!audioFile || !audioFile.name) {
    return NextResponse.json(
      { error: "Audio file is required" },
      { status: 400 }
    );
  }

  if (!audioFile || !title || isNaN(trackNumber)) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const audiobook = await prisma.audiobook.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      authorId: true,
    },
  });

  if (!audiobook) {
    return NextResponse.json({ error: "Audiobook not found" }, { status: 404 });
  }

  const isAuthorized = user.role === "ADMIN" || user.id === audiobook.authorId;
  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (audiobook.status === "PUBLISHED" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Cannot add chapters to published audiobook" },
      { status: 400 }
    );
  }

  // ⏱ Extract duration in seconds
  let durationInSeconds = 0;
  try {
    durationInSeconds = await getAudioDuration(audioFile);
  } catch (err) {
    console.error("Error extracting audio duration:", err);
    return NextResponse.json(
      { error: "Failed to extract audio duration" },
      { status: 500 }
    );
  }

  const { url: audioUrl } = await uploadChapterAudio(audioFile);

  const chapter = await prisma.chapter.create({
    data: {
      title,
      trackNumber,
      audioFile: audioUrl,
      audiobookId: audiobook.id,
      isDraft: true,
      duration: durationInSeconds,
    },
  });

  return NextResponse.json({ message: "Chapter uploaded", chapter });
}
