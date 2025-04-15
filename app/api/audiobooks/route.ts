import { getCurrentSession } from "@/lib/auth/authUtils";
import { prisma } from "@/lib/prisma";
export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!session.role || session.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const {
      title,
      author,
      narrator,
      description,
      coverImage,
      audioFile,
      duration,
      genre,
      releaseDate,
    } = await req.json();

    const audiobook = await prisma.audiobook.create({
      data: {
        title,
        author,
        narrator,
        description,
        coverImage,
        audioFile,
        duration,
        genre,
        releaseDate: new Date(releaseDate),
      },
    });
    return Response.json(audiobook);
  } catch (error) {
    return Response.json(
      { error: "Failed to create audiobook." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const audiobooks = await prisma.audiobook.findMany({
      include: { Reviews: true, Bookmarks: true },
    });
    return Response.json(audiobooks);
  } catch (error) {
    console.error("Error fetching audiobooks:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
