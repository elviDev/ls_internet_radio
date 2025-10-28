import { getCurrentUser } from "./getCurrentUser";
import { NextResponse } from "next/server";

/**
 * Higher-order function that protects routes for approved staff only
 * Unapproved staff will be treated as regular users and denied access
 */
export function staffOnly<T extends any[]>(
  handler: (req: Request, ...args: T) => Promise<Response>
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    try {
      const user = await getCurrentUser();

      // No user authenticated
      if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // User exists but is not approved - treat as regular user
      if (!user.isApproved) {
        return NextResponse.json({ 
          error: "Staff approval required. Your account is pending admin approval." 
        }, { status: 403 });
      }

      // Approved staff can proceed
      return handler(req, ...args);
    } catch (error) {
      console.error("Staff authentication error:", error);
      return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
  };
}