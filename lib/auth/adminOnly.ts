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
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Allow all approved staff members (any staff role)
    const staffRoles = ["ADMIN", "HOST", "CO_HOST", "PRODUCER", "SOUND_ENGINEER", "CONTENT_MANAGER", "TECHNICAL_SUPPORT"];
    const isStaff = staffRoles.includes(user.role);
    
    if (!isStaff) {
      return NextResponse.json({ error: "Staff access required. Only staff members can access this resource." }, { status: 403 });
    }
    
    // Check if staff user is approved
    if (!user.isApproved) {
      return NextResponse.json({ error: "Your staff account is pending approval. Please contact an administrator." }, { status: 403 });
    }

    return handler(req, context);
  };
}
