// Simple in-memory rate limiter for edge functions
// Uses a sliding window approach per IP/user

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
function cleanup() {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited.
 * @param key - unique identifier (IP, user ID, etc.)
 * @param maxRequests - max requests per window
 * @param windowMs - time window in milliseconds
 * @returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();

  // Periodic cleanup every 100 calls
  if (rateLimitMap.size > 500) cleanup();

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    const retryAfterMs = entry.resetAt - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}

/**
 * Build rate-limit headers for the response
 */
export function rateLimitHeaders(
  remaining: number,
  retryAfterMs: number
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": String(remaining),
  };
  if (retryAfterMs > 0) {
    headers["Retry-After"] = String(Math.ceil(retryAfterMs / 1000));
  }
  return headers;
}

/**
 * Extract a rate-limit key from the request (IP or user ID fallback)
 */
export function getRateLimitKey(req: Request, prefix: string, userId?: string): string {
  if (userId) return `${prefix}:user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${prefix}:ip:${ip}`;
}
