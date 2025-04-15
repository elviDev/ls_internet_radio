import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/auth/authSchemas";
import { generateToken, hashPassword } from "@/lib/auth/authUtils";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";
import crypto from "crypto";

export const POST = async (req: Request) => {
  try {
    const body = await req.json();

    // Validate incoming data
    const parsedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(parsedData.password);

    // Generate a unique verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Create the user with the token
    const user = await prisma.user.create({
      data: {
        email: parsedData.email,
        password: hashedPassword,
        name: parsedData.name,
        verificationToken,
        verificationTokenExpires: tokenExpires,
      },
    });

    // Send verification email using Resend
    await sendVerificationEmail(user.email, verificationToken);

    // Generate temporary login token if needed
    const token = generateToken(user.id);

    return NextResponse.json({
      token,
      message: "User created. Please verify your email.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to sign up" }, { status: 500 });
  }
};
