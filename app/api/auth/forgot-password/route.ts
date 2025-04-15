import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendResetPasswordEmail } from "@/lib/email/sendResetPasswordEmail"; // You need to create this function

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { email } = body;

    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Check if the user has requested a password reset recently

    const timeSinceLastRequest =
      new Date().getTime() - user.updatedAt.getTime();

    if (timeSinceLastRequest < 10 * 60 * 1000) {
      // 10 minutes
      return NextResponse.json(
        { error: "You can only request a password reset every 10 minutes" },
        { status: 429 }
      );
    }

    // Generate reset token and set expiration (1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    // Update user with reset token and expiration
    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordTokenExpires: resetTokenExpires,
      },
    });

    // Send reset password email with token
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

    await sendResetPasswordEmail(email, resetLink);

    return NextResponse.json({ message: "Password reset email sent" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send reset email" },
      { status: 500 }
    );
  }
};
