import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { Role } from "@prisma/client";
import { uploadToS3 } from "@/lib/storage/uploadToS3";
import { deleteFromS3 } from "@/lib/storage/deleteFromS3";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.ADMIN) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const genre = await prisma.genre.findUnique({ where: { id: params.id } });
  if (!genre) return new NextResponse("Genre not found", { status: 404 });

  const formData = await req.formData();
  const name = formData.get("name")?.toString();
  const slug = formData.get("slug")?.toString();
  const description = formData.get("description")?.toString();
  const imageFile = formData.get("coverImage") as File | null;

  let imageUrl = genre.coverImage;

  if (imageFile) {
    // delete old image from S3
    if (genre.coverImage) {
      const key = new URL(genre.coverImage).pathname
        .split("/")
        .slice(2)
        .join("/");
      await deleteFromS3(key);
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const upload = await uploadToS3(
      buffer,
      imageFile.name,
      imageFile.type,
      "genres"
    );
    imageUrl = upload.url;
  }

  const updated = await prisma.genre.update({
    where: { id: params.id },
    data: {
      name: name || undefined,
      slug: slug || undefined,
      description: description || undefined,
      coverImage: imageUrl,
    },
  });

  return NextResponse.json(updated);
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || undefined;
  const genre = await prisma.genre.findFirst({
    where: {
      OR: [{ id }, { slug: slug }],
    },
    include: {
      audiobooks: {
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          coverImage: true,
          slug: true,
        },
      },
    },
  });

  if (!genre) {
    return new NextResponse("Genre not found", { status: 404 });
  }

  return NextResponse.json(genre);
}
