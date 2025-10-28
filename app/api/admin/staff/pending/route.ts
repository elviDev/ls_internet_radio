import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";

// GET /api/admin/staff/pending - Get all pending staff applications
export const GET = adminOnly(async (req: Request) => {
  try {
    const pendingStaff = await prisma.staff.findMany({
      where: { 
        isApproved: false,
        isActive: true // Only get active accounts (not rejected)
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        phone: true,
        requestedRole: true,
        department: true,
        position: true,
        bio: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" }, // Oldest first
    });

    return NextResponse.json({
      pendingStaff: pendingStaff.map(staff => ({
        ...staff,
        createdAt: staff.createdAt.toISOString(),
      })),
      count: pendingStaff.length,
    });
  } catch (error) {
    console.error("Error fetching pending staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending staff applications" },
      { status: 500 }
    );
  }
});