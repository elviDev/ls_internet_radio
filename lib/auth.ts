import { compare, hash } from "bcryptjs"
import { sign, verify } from "jsonwebtoken"
import { cookies } from "next/headers"
import { nanoid } from "nanoid"
import User from "@/models/User"
import dbConnect from "@/lib/mongoose"
import { setSession, getSession, deleteSession, cacheUser, getCachedUser, invalidateUserCache } from "./redis"

// Constants
const TOKEN_SECRET = process.env.TOKEN_SECRET || "your-fallback-secret-key-change-this"
const TOKEN_EXPIRY = "7d" // 7 days
const COOKIE_NAME = "auth_token"

// Types
export type UserSession = {
  id: string
  email: string
  name: string | null
  role: string
  profilePicture?: string | null
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

// Create session token
export async function createSession(userId: string): Promise<string> {
  // Generate a unique session ID
  const sessionId = nanoid(32)

  // Generate JWT token with the session ID
  const token = sign({ sessionId }, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRY })

  // Store session in Redis
  await setSession(sessionId, userId)

  return token
}

// Set session cookie
export function setSessionCookie(token: string): void {
  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

// Clear session cookie
export function clearSessionCookie(): void {
  cookies().delete(COOKIE_NAME)
}

// Get current session
export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) return null

    // Verify token
    const decoded = verify(token, TOKEN_SECRET) as { sessionId: string }
    const { sessionId } = decoded

    // Get session from Redis
    const session = await getSession(sessionId)
    if (!session) return null

    const { userId } = session

    // Try to get user from cache first
    let user = await getCachedUser(userId)

    // If not in cache, get from database and cache it
    if (!user) {
      await dbConnect()
      const dbUser = await User.findById(userId).lean()

      if (!dbUser) return null

      user = {
        id: dbUser._id.toString(),
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        profilePicture: dbUser.profilePicture,
      }

      // Cache user data
      await cacheUser(userId, user)
    }

    return user as UserSession
  } catch (error) {
    console.error("Session error:", error)
    return null
  }
}

// Delete session
export async function deleteUserSession(token: string): Promise<void> {
  try {
    const decoded = verify(token, TOKEN_SECRET) as { sessionId: string }
    const { sessionId } = decoded

    // Delete session from Redis
    await deleteSession(sessionId)
  } catch (error) {
    console.error("Error deleting session:", error)
  }
}

// Invalidate user cache when user data changes
export async function invalidateUser(userId: string): Promise<void> {
  await invalidateUserCache(userId)
}
