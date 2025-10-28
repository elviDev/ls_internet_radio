import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { cookies } from "next/headers";

export async function GET() {
  console.log("[Session API] Starting session check");
  try {
    const user = await getCurrentUser();
    console.log("[Session API] getCurrentUser result:", user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved
    } : 'No user found');

    if (!user) {
      console.log("[Session API] No user found - clearing invalid token cookie");
      // Clear the invalid token cookie
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.set("token", "", {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      });
      return response;
    }

    // Return user data without sensitive information
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isApproved: user.isApproved,
      profileImage: user.profileImage,
    };

    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (error: any) {
    console.error("[Session API] Error:", error.message);
    // Clear invalid token cookie
    const response = NextResponse.json({ user: null }, { status: 200 });
    response.cookies.set("token", "", { 
      maxAge: 0, 
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
    return response;
  }
}