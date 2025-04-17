import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const existingToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!existingToken || existingToken.type !== "email_verification") {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 }
    );
  }

  if (existingToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }

  await prisma.user.update({
    where: { id: existingToken.userId },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.json({ message: "Email successfully verified" });
}
