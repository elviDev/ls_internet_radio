import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        profileImage: true,
        role: true,
        createdAt: true,
        bio: true,
        username: true,
        _count: {
          select: {
            audiobooks: true,
            podcasts: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const publicProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      profileImage: user.profileImage,
      bio: user.bio,
      role:
        user.role === "ADMIN" || user.role === "USER" ? undefined : user.role,
      joinedAt: user.createdAt,
      stats: {
        audiobooks: user._count.audiobooks,
        podcasts: user._count.podcasts,
      },
    };

    return NextResponse.json(publicProfile);
  } catch (error) {
    console.error("[PUBLIC_PROFILE_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
