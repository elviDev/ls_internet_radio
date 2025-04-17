import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/email/getVerificationEmail";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({
        message: "If this email exists, a verification link has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email is already verified." });
    }

    const token = randomUUID();
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Clean up any existing token
    await prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: "email_verification",
      },
    });

    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        type: "email_verification",
        expiresAt: expires,
      },
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json({
      message: "If this email exists, a verification link has been sent.",
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
