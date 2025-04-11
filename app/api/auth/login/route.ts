import { type NextRequest, NextResponse } from "next/server"
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth"
import { rateLimitMiddleware } from "@/lib/rate-limit"
import User from "@/models/User"
import dbConnect from "@/lib/mongoose"

// Rate limit: 5 attempts per minute
const loginRateLimit = rateLimitMiddleware({ limit: 5, window: 60 })

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await loginRateLimit(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Find user
    const user = await User.findOne({ email }).lean()

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create session
    const token = await createSession(user._id.toString())

    // Set session cookie
    setSessionCookie(token)

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 })
  }
}
