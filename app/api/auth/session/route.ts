import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/authUtils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Get full user data including profile picture
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching session" },
      { status: 500 }
    );
  }
}
