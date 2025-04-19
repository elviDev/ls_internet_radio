import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";
import { uploadToS3 } from "@/lib/storage/uploadToS3";
import { AudiobookStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const narrator = formData.get("narrator")?.toString();
    const description = formData.get("description")?.toString();
    const genreId = formData.get("genreId")?.toString();
    const releaseDate = formData.get("releaseDate")?.toString();
    const coverImage = formData.get("coverImage") as File | null;

    if (
      title === undefined ||
      narrator === undefined ||
      description === undefined ||
      genreId === undefined ||
      coverImage === null
    ) {
      return new NextResponse("All fields are required", { status: 400 });
    } else {
      // validate genre
      const genreExists = await prisma.genre.findUnique({
        where: { id: genreId },
      });
      if (!genreExists) {
        return new NextResponse("Invalid genre ID", { status: 400 });
      }

      const buffer = Buffer.from(await coverImage.arrayBuffer());
      const upload = await uploadToS3(
        buffer,
        coverImage.name,
        coverImage.type,
        "audiobooks"
      );

      const slug = slugify(title, { lower: true, strict: true });
      const existingSlug = await prisma.audiobook.findUnique({
        where: { slug },
      });
      if (existingSlug) {
        return new NextResponse("Slug already exists", { status: 409 });
      }

      const audiobook = await prisma.audiobook.create({
        data: {
          title,
          slug,
          narrator,
          description,
          coverImage: upload.url,
          genreId,
          duration: 0,
          authorId: user.id,
          releaseDate: new Date(),
          status: AudiobookStatus.DRAFT,
        },
      });

      return NextResponse.json(
        { message: "Audiobook created in draft mode", data: audiobook },
        { status: 201 }
      );
    }
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
