import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  (await cookies()).delete("token");

  return NextResponse.json({ message: "Logged out successfully" });
}

export async function GET() {
  // Allow GET for direct browser access to clear cookies
  (await cookies()).delete("token");
  
  // Redirect to signin page
  return NextResponse.redirect(new URL("/signin", "http://localhost:3000"));
}
