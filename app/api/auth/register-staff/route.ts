import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const staffRegistrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  requestedRole: z.enum(["HOST", "CO_HOST", "PRODUCER", "SOUND_ENGINEER", "CONTENT_MANAGER", "TECHNICAL_SUPPORT"]),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = staffRegistrationSchema.parse(body);

    // Check if username or email already exists in Staff table
    const existingStaff = await prisma.staff.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email }
        ]
      }
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 400 }
      );
    }

    // Check if email already exists in User table
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists in user accounts" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create pending staff account
    const staff = await prisma.staff.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: hashedPassword,
        requestedRole: data.requestedRole,
        role: "HOST", // Default role until approved
        department: data.department,
        position: data.position,
        phone: data.phone,
        bio: data.bio,
        emailVerified: false,
        isActive: true,
        isApproved: false, // Pending approval
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        requestedRole: true,
        isApproved: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Staff registration submitted successfully. Your account is pending admin approval.",
      staff: {
        ...staff,
        name: `${staff.firstName} ${staff.lastName}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Staff registration error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to register staff account" },
      { status: 500 }
    );
  }
}