import { NextResponse } from "next/server";
import { getCurrentUser } from "./getCurrentUser";
import { StaffRole } from "@prisma/client";

export function adminOnly(
  handler: (req: Request, context: { params: any }) => Promise<Response>
) {
  return async function (req: Request, context: { params: any }) {
    const user = await getCurrentUser();

    // Check if user exists
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Allow all approved staff members (any staff role)
    const isStaff = Object.values(StaffRole).includes(user.role as StaffRole);
    
    if (!isStaff) {
      return NextResponse.json({ message: "Staff access required" }, { status: 403 });
    }
    
    // Check if staff user is approved
    if (!user.isApproved) {
      return NextResponse.json({ message: "Staff account not approved" }, { status: 403 });
    }

    return handler(req, context);
  };
}
