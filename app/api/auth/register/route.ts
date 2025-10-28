import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { resend } from "@/lib/resend";
import { sendVerificationEmail } from "@/lib/email/getVerificationEmail";
import { generateToken } from "@/utils/tokens";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  userType: z.enum(["user", "staff"]),
  role: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.userType === "staff" && (!data.role || data.role === "")) {
    return false;
  }
  return true;
}, {
  message: "Role is required for staff registration",
  path: ["role"],
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Registration request body:', body);
    const { firstName, lastName, username, email, password, confirmPassword, phone, userType, role } = registerSchema.parse(body);

    const [existingUser, existingStaff, existingUserUsername, existingStaffUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.staff.findUnique({ where: { email } }),
      prisma.user.findFirst({ where: { username } }),
      prisma.staff.findUnique({ where: { username } })
    ]);
    
    if (existingUser || existingStaff) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    if (existingUserUsername || existingStaffUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const token = generateToken();

    if (userType === "staff") {
      if (!role) {
        return NextResponse.json(
          { error: "Role is required for staff registration" },
          { status: 400 }
        );
      }

      const staff = await prisma.staff.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          username,
          phone,
          role: role as any,
          isApproved: false,
        },
      });

      await prisma.verificationToken.create({
        data: {
          token,
          userId: staff.id,
          type: "email_verification",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });
    } else {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          username,
        },
      });

      await prisma.userVerificationToken.create({
        data: {
          token,
          userId: user.id,
          type: "email_verification",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });
    }

    try {
      await sendVerificationEmail(token, email);
      return NextResponse.json(
        { message: `${userType === 'staff' ? 'Staff account' : 'User account'} created. Verification email sent.` },
        { status: 201 }
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return NextResponse.json(
        { message: `${userType === 'staff' ? 'Staff account' : 'User account'} created. Email verification disabled in development.` },
        { status: 201 }
      );
    }
  } catch (err: any) {
    console.error('Registration error:', err);
    if (err instanceof z.ZodError) {
      const firstError = err.errors[0];
      let errorMessage = "Please check your input and try again.";
      
      if (firstError.path.includes('confirmPassword')) {
        errorMessage = "Passwords don't match. Please make sure both password fields are identical.";
      } else if (firstError.path.includes('role')) {
        errorMessage = "Please select a role for staff registration.";
      } else if (firstError.path.includes('email')) {
        errorMessage = "Please enter a valid email address.";
      } else if (firstError.path.includes('password')) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (firstError.message) {
        errorMessage = firstError.message;
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
  }
}
