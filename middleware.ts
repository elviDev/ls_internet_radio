import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verify } from "jsonwebtoken"
import { getSession } from "./lib/redis"

// Routes that require authentication
const protectedRoutes = ["/admin"]

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value
  const path = request.nextUrl.pathname

  // Check if the route requires authentication (only admin routes)
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  // If no token and trying to access protected route, redirect to login
  if (!token && isProtectedRoute) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(url)
  }

  // If token exists, verify it for protected routes
  if (token && isProtectedRoute) {
    try {
      const decoded = verify(token, process.env.TOKEN_SECRET || "your-fallback-secret-key-change-this") as {
        sessionId: string
      }
      const { sessionId } = decoded

      // Check if session exists in Redis
      const session = await getSession(sessionId)

      // If session is invalid and trying to access protected route, redirect to login
      if (!session) {
        const url = new URL("/login", request.url)
        url.searchParams.set("callbackUrl", path)
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // If token is invalid and trying to access protected route, redirect to login
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", path)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
