import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { uploadToS3 } from "@/lib/storage/uploadToS3";
import slugify from "slugify";

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
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.audiobook.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Audiobook not found" }, { status: 404 });
  }

  const isAuthorized = user.role === "ADMIN" || user.id === existing.createdById;
  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (existing.status === "PUBLISHED" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Published audiobooks cannot be edited" },
      { status: 400 }
    );
  }

  // const body = await req.json();
  // const parse = updateAudiobookSchema.safeParse(body);

  const formData = await req.formData();
  const title = formData.get("title")?.toString();
  const narrator = formData.get("narrator")?.toString();
  const description = formData.get("description")?.toString();
  const genreId = formData.get("genreId")?.toString();
  const releaseDate = formData.get("releaseDate")?.toString();
  const coverImage = formData.get("coverImage") as File;

  const buffer = Buffer.from(await coverImage.arrayBuffer());
  const upload = await uploadToS3(
    buffer,
    coverImage.name,
    coverImage.type,
    "audiobooks"
  );

  const slug = slugify(title!, { lower: true, strict: true });
  const updated = await prisma.audiobook.update({
    where: { id },
    data: {
      title: title,
      narrator: narrator,
      description: description,
      genreId: genreId,
      releaseDate: releaseDate,
      coverImage: upload.url,
      slug: slug,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    message: "Audiobook updated",
    audiobook: updated,
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const includeChapters = searchParams.get("withChapters") === "true";
    const slug = searchParams.get("slug") || undefined;

    const user = await getCurrentUser();

    // Try to find by slug or ID
    const audiobook = await prisma.audiobook.findFirst({
      where: {
        OR: [{ id }, { slug: slug }],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        genre: {
          select: {
            id: true,
            name: true,
            slug: true,
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

    const isOwner = user?.id === audiobook.createdById;
    const isAdmin = user?.role === "ADMIN";

    // If not published, check access
    if (audiobook.status !== "PUBLISHED" && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Transform the response to include author info
    const transformedAudiobook = {
      ...audiobook,
      author: audiobook.createdBy ? `${audiobook.createdBy.firstName} ${audiobook.createdBy.lastName}` : 'Unknown Author'
    };
    
    return NextResponse.json({ data: transformedAudiobook });
  } catch (error) {
    console.error("Error fetching audiobook:", error);
    return NextResponse.json(
      { error: "Failed to fetch audiobook" },
      { status: 500 }
    );
  }
}
