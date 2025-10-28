import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Routes that require authentication
const protectedRoutes: string[] = [];
// Routes that authenticated users should not access
const guestOnlyRoutes = ["/signin", "/signup", "/register"];
// Routes that require staff access
const staffOnlyRoutes = ["/dashboard"];

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const path = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );
  const isGuestOnlyRoute = guestOnlyRoutes.some((route) =>
    path === route
  );

  // Debug logging
  console.log(`[Middleware] Path: ${path}, Protected: ${isProtectedRoute}, GuestOnly: ${isGuestOnlyRoute}, Token exists: ${!!token}`);

  // Check if user has valid token
  let hasValidToken = false;
  
  if (token) {
    try {
      console.log(`[Middleware] Attempting to verify token with secret length: ${JWT_SECRET.length}`);
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      hasValidToken = true;
      console.log(`[Middleware] Valid token found for user: ${payload.userId}`);
    } catch (error: any) {
      console.log(`[Middleware] Token verification failed:`, error.message);
      hasValidToken = false;
      // Clear invalid token
      const response = NextResponse.next();
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

  // Handle protected routes
  if (isProtectedRoute) {
    if (!hasValidToken) {
      console.log(`[Middleware] No valid token for protected route ${path}, redirecting to signin`);
      const url = new URL("/signin", request.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
  }

  // Handle staff-only routes (dashboard)
  const isStaffOnlyRoute = staffOnlyRoutes.some((route) => path.startsWith(route));
  
  if (isStaffOnlyRoute && hasValidToken) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token!, secret);
      
      // Check if user has staff role (not USER role)
      if (payload.role === 'USER') {
        console.log(`[Middleware] Regular user accessing staff route ${path}, redirecting to profile`);
        return NextResponse.redirect(new URL("/profile", request.url));
      }
    } catch (error) {
      console.log(`[Middleware] Error checking user role:`, error);
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  // Handle guest-only routes (signin, signup, register)
  if (isGuestOnlyRoute && hasValidToken) {
    console.log(`[Middleware] Authenticated user accessing guest-only route ${path}, redirecting to profile`);
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
