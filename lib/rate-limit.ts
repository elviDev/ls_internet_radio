import { type NextRequest, NextResponse } from "next/server";

type RateLimitOptions = {
  limit: number;
  window: number; // in seconds
};

// In-memory store
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = { limit: 5, window: 60 }
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const ip = getClientIp(req);
  const path = req.nextUrl.pathname;
  const key = `${ip}:${path}`;

  const now = Date.now();
  const existing = rateLimitMap.get(key);

  if (existing && existing.expiresAt > now) {
    existing.count += 1;
    rateLimitMap.set(key, existing);
  } else {
    rateLimitMap.set(key, {
      count: 1,
      expiresAt: now + options.window * 1000,
    });
  }

  const { count, expiresAt } = rateLimitMap.get(key)!;
  const remaining = Math.max(0, options.limit - count);
  const reset = Math.ceil((expiresAt - now) / 1000);
  const success = count <= options.limit;

  return {
    success,
    limit: options.limit,
    remaining,
    reset,
  };
}

export function rateLimitMiddleware(
  options: RateLimitOptions = { limit: 5, window: 60 }
) {
  return async function middleware(req: NextRequest) {
    const result = await rateLimit(req, options);

    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests, please try again later" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.reset.toString(),
            "Retry-After": result.reset.toString(),
          },
        }
      );
    }

    return null;
  };
}
