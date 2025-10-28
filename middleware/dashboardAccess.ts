import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function dashboardAccessMiddleware(request: Request) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // Check if user is staff (has role property and it's not USER)
  const isStaff = 'role' in currentUser && currentUser.role !== 'USER';
  
  if (!isStaff) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  return NextResponse.next();
}