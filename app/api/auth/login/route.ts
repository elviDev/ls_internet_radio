import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/hash";
import { signToken } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberMe: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, rememberMe = false } = loginSchema.parse(body);

    // First check if user exists in Staff table
    let user = await prisma.staff.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isApproved: true,
        emailVerified: true,
      }
    });
    let isStaff = true;

    // If not found in Staff, check User table
    if (!user) {
      user = await prisma.user.findUnique({ 
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          emailVerified: true,
        }
      });
      isStaff = false;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
console.log("User found",user);
    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email" },
        { status: 403 }
      );
    }

    // Check if staff member is approved
    if (isStaff && !user.isApproved) {
      return NextResponse.json(
        { error: "Your account is pending approval" },
        { status: 403 }
      );
    }

    const token = await signToken({ userId: user.id });

    // Set cookie expiration based on remember me option
    const cookieOptions: any = {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    };

    if (rememberMe) {
      // Remember for 30 days
      cookieOptions.maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
    } else {
      // Session cookie (expires when browser closes)
      // No maxAge means session cookie
    }

    (await cookies()).set("token", token, cookieOptions);

    // Prepare user data for response
    let userData;
    if (isStaff) {
      userData = {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        isApproved: user.isApproved || false,
      };
    } else {
      userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'USER',
        isApproved: true,
      };
    }

    return NextResponse.json(
      { token, user: userData },
      { status: 200 }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.log(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
