import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { Staff } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET!;

interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export async function getCurrentUser() {
  try {
    const token = (await cookies()).get("token")?.value;
    console.log("[getCurrentUser] Token exists:", !!token);

    if (!token) {
      console.log("[getCurrentUser] No token found");
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; iat: number; exp: number };
    console.log("[getCurrentUser] Decoded token userId:", decoded.userId);

    // First check User table
    console.log("[getCurrentUser] Checking User table for:", decoded.userId);
    const regularUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    console.log("[getCurrentUser] Regular user found:", !!regularUser);

    if (regularUser) {
      console.log("[getCurrentUser] Returning regular user");
      return {
        ...regularUser,
        role: 'USER',
        isApproved: true,
        firstName: regularUser.name?.split(' ')[0] || '',
        lastName: regularUser.name?.split(' ').slice(1).join(' ') || '',
      };
    }

    // If not found in User table, try Staff table
    console.log("[getCurrentUser] Checking Staff table for:", decoded.userId);
    let user = await prisma.staff.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isApproved: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    }).catch((error) => {
      console.log("[getCurrentUser] Staff query error:", error.message);
      return null;
    });
    console.log("[getCurrentUser] Staff user found:", !!user);

    if (user) {
      console.log("[getCurrentUser] Returning staff user");
      // Add computed name field for staff
      return {
        ...user,
        name: `${user.firstName} ${user.lastName}`,
      };
    }

    console.log("[getCurrentUser] No user found in either table");
    return null;
  } catch (error: any) {
    console.log("[getCurrentUser] Exception caught:", error.message);
    return null;
  }
}
