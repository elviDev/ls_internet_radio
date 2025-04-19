import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { Role } from "@prisma/client";
import { uploadToS3 } from "@/lib/storage/uploadToS3";

export async function GET() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(genres);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.ADMIN) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const formData = await req.formData();
  const name = formData.get("name")?.toString();
  const slug = formData.get("slug")?.toString();
  const description = formData.get("description")?.toString();
  const imageFile = formData.get("coverImage") as File | null;

  if (!name || !slug) {
    return new NextResponse("Name and slug are required", { status: 400 });
  }

  const existing = await prisma.genre.findUnique({ where: { slug } });
  if (existing) {
    return new NextResponse("Genre with this slug already exists", {
      status: 409,
    });
  }

  let imageUrl: string | undefined = undefined;
  if (imageFile) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const upload = await uploadToS3(
      buffer,
      imageFile.name,
      imageFile.type,
      "genres"
    );
    imageUrl = upload.url;
  }

  const genre = await prisma.genre.create({
    data: {
      name,
      slug,
      description,
      coverImage: imageUrl,
    },
  });

  return NextResponse.json(genre, { status: 201 });
}
