import { type NextRequest, NextResponse } from "next/server";
import { deleteUserSession, clearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Access cookies directly from the request object
    const token = req.cookies.get("auth_token")?.value;

    if (token) {
      // Delete session from Redis
      await deleteUserSession(token);
    }

    // Clear the cookie
    clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}
