import { compare, hash } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// Constants
const TOKEN_SECRET =
  process.env.TOKEN_SECRET || "your-fallback-secret-key-change-this";
const TOKEN_EXPIRY = "7d"; // 7 days
const COOKIE_NAME = "auth_token";

// Types
export type UserSession = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  profilePicture?: string | null;
};

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(password, hashedPassword);
}

// Create JWT directly with user data (no Redis session)
export async function createSession(user: UserSession): Promise<string> {
  const token = sign(user, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRY });
  return token;
}

// Set session cookie
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Clear session cookie
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get current session
export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verify(token, TOKEN_SECRET) as UserSession;
    return decoded;
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
}

// Delete session (just remove the cookie in this stateless setup)
export async function deleteUserSession(): Promise<void> {
  await clearSessionCookie();
}
