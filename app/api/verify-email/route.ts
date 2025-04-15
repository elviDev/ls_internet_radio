import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is missing" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user || !user.verificationTokenExpires) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const now = new Date();

    if (user.verificationTokenExpires < now) {
      return NextResponse.json({ error: "Token has expired" }, { status: 410 });
    }

    // Optional: Rate-limit verification requests (e.g., once every 10s)
    const timeSinceLastTry = now.getTime() - user.updatedAt.getTime();
    if (timeSinceLastTry < 10 * 1000) {
      return NextResponse.json(
        { error: "Please wait before trying again" },
        { status: 429 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    return NextResponse.json({ message: "Email verified successfully." });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
};
