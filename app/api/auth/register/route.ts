import { type NextRequest, NextResponse } from "next/server"
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth"
import { rateLimitMiddleware } from "@/lib/rate-limit"
import User from "@/models/User"
import dbConnect from "@/lib/mongoose"

// Rate limit: 3 attempts per hour
const registerRateLimit = rateLimitMiddleware({ limit: 3, window: 3600 })

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await registerRateLimit(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { name, email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Connect to database
    await dbConnect()

    // Check if user already exists
    const existingUser = await User.findOne({ email }).lean()

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    })

    const user = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      profilePicture: newUser.profilePicture,
    }

    // Create session
    const token = await createSession(newUser._id.toString())

    // Set session cookie
    setSessionCookie(token)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "An error occurred during registration" }, { status: 500 })
  }
}
