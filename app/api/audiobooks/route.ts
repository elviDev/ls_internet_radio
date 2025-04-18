import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema validation
const audiobookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, URL-safe, and hyphenated"),
  narrator: z.string().min(1, "Narrator is required"),
  description: z.string().min(1, "Description is required"),
  coverImage: z.string().url("Cover image must be a valid URL"),
  genre: z.string().min(1, "Genre is required"),
  releaseDate: z.string().datetime("Invalid release date"),
  duration: z.number().int().positive("Duration must be a positive integer"),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = audiobookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      title,
      slug,
      narrator,
      description,
      coverImage,
      genre,
      releaseDate,
      duration,
    } = parsed.data;

    // Check for slug uniqueness
    const existing = await prisma.audiobook.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Slug already in use. Please choose a different one." },
        { status: 409 }
      );
    }

    const audiobook = await prisma.audiobook.create({
      data: {
        title,
        slug,
        narrator,
        description,
        coverImage,
        genre,
        duration,
        releaseDate: new Date(releaseDate),
        authorId: user.id,
      },
    });

    return NextResponse.json(
      { message: "Audiobook created in draft mode", data: audiobook },
      { status: 201 }
    );
  } catch (error) {
    console.error("Audiobook creation error:", error);
    return NextResponse.json(
      { error: "Internal server error while creating audiobook" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "published";
    const authorId = searchParams.get("authorId") || undefined;
    const query = searchParams.get("q") || "";

    const user = await getCurrentUser();

    const filters: any = {
      status,
      title: query ? { contains: query, mode: "insensitive" } : undefined,
      ...(authorId && { authorId }),
    };

    // Only show draft if user is authorized
    if (status === "draft") {
      if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const audiobooks = await prisma.audiobook.findMany({
      where: filters,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        coverImage: true,
        narrator: true,
        genre: true,
        duration: true,
        releaseDate: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({ data: audiobooks });
  } catch (error) {
    console.error("Failed to fetch audiobooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch audiobooks" },
      { status: 500 }
    );
  }
}
