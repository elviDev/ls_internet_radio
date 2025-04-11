import { type NextRequest, NextResponse } from "next/server";

// Utility to clear the session cookie
function clearSessionCookie(response: NextResponse) {
  response.cookies.set("auth_token", "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, // Immediately expire the cookie
  });
}

export async function POST(req: NextRequest) {
  try {
    // Optionally log or use the token (not needed anymore without Redis)
    const token = req.cookies.get("auth_token")?.value;

    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}
