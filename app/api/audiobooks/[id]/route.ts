import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const audiobook = await prisma.audiobook.findUnique({
      where: { id },
      include: {
        Reviews: true,
        Bookmarks: true,
        AudiobookTranscripts: true,
        PlaylistItems: true,
      },
    });
    if (!audiobook) {
      return new Response("Audiobook not found", { status: 404 });
    }
    return Response.json(audiobook);
  } catch (error) {
    console.error("Error fetching audiobook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const audiobook = await prisma.audiobook.delete({
      where: { id },
    });
    return Response.json(audiobook);
  } catch (error) {
    console.error("Error deleting audiobook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const data = await req.json();
  try {
    const audiobook = await prisma.audiobook.update({
      where: { id },
      data,
    });
    return Response.json(audiobook);
  } catch (error) {
    console.error("Error updating audiobook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
