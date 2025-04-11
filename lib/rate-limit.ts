import { redis } from "./redis"
import { type NextRequest, NextResponse } from "next/server"

type RateLimitOptions = {
  limit: number
  window: number // in seconds
}

export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = { limit: 5, window: 60 },
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const ip = req.ip || "anonymous"
  const key = `rate-limit:${ip}:${req.nextUrl.pathname}`

  // Get the current count and expiry
  const [count, expiry] = await redis.pipeline().incr(key).ttl(key).exec()

  // If this is the first request, set the expiry
  if (count === 1) {
    await redis.expire(key, options.window)
  }

  const remaining = Math.max(0, options.limit - (count as number))
  const reset = expiry as number

  return {
    success: (count as number) <= options.limit,
    limit: options.limit,
    remaining,
    reset,
  }
}

export function rateLimitMiddleware(options: RateLimitOptions = { limit: 5, window: 60 }) {
  return async function middleware(req: NextRequest) {
    const result = await rateLimit(req, options)

    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests, please try again later" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": options.limit.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.reset.toString(),
            "Retry-After": result.reset.toString(),
          },
        },
      )
    }

    // Continue with the request
    return null
  }
}
