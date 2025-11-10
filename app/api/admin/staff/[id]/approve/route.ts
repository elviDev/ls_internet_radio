import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// POST /api/admin/staff/[id]/approve - Approve a pending staff application
export const POST = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN role can approve staff
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Check if staff member exists and is pending approval
    const staff = await prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isApproved: true,
        requestedRole: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (staff.isApproved) {
      return NextResponse.json({ error: "Staff member is already approved" }, { status: 400 });
    }

    // Approve the staff member
    const approvedStaff = await prisma.staff.update({
      where: { id },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: currentUser.id,
        role: staff.requestedRole || "HOST", // Set role to requested role
        emailVerified: true, // Auto-verify email on approval
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isApproved: true,
        approvedAt: true,
        approver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Staff member approved successfully",
      staff: {
        ...approvedStaff,
        name: `${approvedStaff.firstName} ${approvedStaff.lastName}`,
        approvedAt: approvedStaff.approvedAt?.toISOString(),
        approvedBy: approvedStaff.approver 
          ? `${approvedStaff.approver.firstName} ${approvedStaff.approver.lastName}`
          : null,
      },
    });
  } catch (error) {
    console.error("Error approving staff member:", error);
    return NextResponse.json(
      { error: "Failed to approve staff member" },
      { status: 500 }
    );
  }
});