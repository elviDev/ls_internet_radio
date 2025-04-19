import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const audiobookId = params.id;

  try {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_audiobookId: {
          userId,
          audiobookId,
        },
      },
    });

    if (existing) {
      // Unfavorite
      await prisma.favorite.delete({
        where: {
          userId_audiobookId: {
            userId,
            audiobookId,
          },
        },
      });

      return NextResponse.json({ message: "Removed from favorites" });
    } else {
      // Favorite
      await prisma.favorite.create({
        data: {
          userId,
          audiobookId,
        },
      });

      return NextResponse.json({ message: "Added to favorites" });
    }
  } catch (error) {
    console.error("Favorite error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
