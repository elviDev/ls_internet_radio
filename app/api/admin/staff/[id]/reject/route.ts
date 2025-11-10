import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnly } from "@/lib/auth/adminOnly";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// POST /api/admin/staff/[id]/reject - Reject a pending staff application
export const POST = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN role can reject staff
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
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (staff.isApproved) {
      return NextResponse.json({ error: "Cannot reject an already approved staff member" }, { status: 400 });
    }

    // Delete the staff application (hard delete for rejected applications)
    await prisma.staff.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Staff application rejected and removed successfully",
      rejectedStaff: {
        id: staff.id,
        name: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
      },
    });
  } catch (error) {
    console.error("Error rejecting staff application:", error);
    return NextResponse.json(
      { error: "Failed to reject staff application" },
      { status: 500 }
    );
  }
});