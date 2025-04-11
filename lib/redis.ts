import { kv } from "@vercel/kv"

export const redis = kv

export async function setWithExpiry(key: string, value: any, expiryInSeconds: number): Promise<void> {
  await redis.set(key, JSON.stringify(value), { ex: expiryInSeconds })
}

export async function get<T>(key: string): Promise<T | null> {
  const value = await redis.get(key)
  return value ? (JSON.parse(value as string) as T) : null
}

export async function del(key: string): Promise<void> {
  await redis.del(key)
}

export async function exists(key: string): Promise<boolean> {
  return (await redis.exists(key)) === 1
}

// Session-specific Redis functions
export const SESSION_PREFIX = "session:"
export const SESSION_EXPIRY = 60 * 60 * 24 * 7 // 7 days in seconds

export async function setSession(sessionId: string, userId: string): Promise<void> {
  await setWithExpiry(`${SESSION_PREFIX}${sessionId}`, { userId }, SESSION_EXPIRY)
}

export async function getSession(sessionId: string): Promise<{ userId: string } | null> {
  return get<{ userId: string }>(`${SESSION_PREFIX}${sessionId}`)
}

export async function deleteSession(sessionId: string): Promise<void> {
  await del(`${SESSION_PREFIX}${sessionId}`)
}

// User cache functions
export const USER_PREFIX = "user:"
export const USER_CACHE_EXPIRY = 60 * 60 * 24 // 24 hours in seconds

export async function cacheUser(userId: string, userData: any): Promise<void> {
  await setWithExpiry(`${USER_PREFIX}${userId}`, userData, USER_CACHE_EXPIRY)
}

export async function getCachedUser(userId: string): Promise<any | null> {
  return get(`${USER_PREFIX}${userId}`)
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await del(`${USER_PREFIX}${userId}`)
}
