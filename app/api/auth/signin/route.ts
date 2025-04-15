import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Prisma client
import { signinSchema } from "@/lib/auth/authSchemas";
import { generateToken, comparePassword } from "@/lib/auth/authUtils";

export const POST = async (req: Request) => {
  try {
    const body = await req.json();

    // Validate the data using the signin schema
    const parsedData = signinSchema.parse(body);

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: parsedData.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Compare the password with the hashed password
    const isPasswordValid = await comparePassword(
      parsedData.password,
      user.password
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    // Generate JWT token
    const token = generateToken(user.id);

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
};
