/**
 * Rate Limiting Utility
 * Simple in-memory rate limiter for API routes
 * Production: Use Redis or external service like Upstash
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key)
      }
    }
  }

  async check(identifier: string, config: RateLimitConfig): Promise<{
    allowed: boolean
    remaining: number
    resetAt: number
  }> {
    const now = Date.now()
    const entry = this.store.get(identifier)

    // No entry or expired
    if (!entry || entry.resetAt < now) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + config.windowMs,
      }
      this.store.set(identifier, newEntry)
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: newEntry.resetAt,
      }
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      }
    }

    // Increment count
    entry.count++
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    }
  }

  stop() {
    clearInterval(this.cleanupInterval)
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

// Predefined rate limit configurations
export const RATE_LIMITS = {
  AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 },      // 5 req / 15 min
  WEBHOOK: { maxRequests: 100, windowMs: 60 * 1000 },      // 100 req / 1 min
  CHECKOUT: { maxRequests: 10, windowMs: 60 * 1000 },      // 10 req / 1 min
  PROMO_VALIDATION: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 req / 1 min
  TRANSFERS: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 req / 1 hour
  API_DEFAULT: { maxRequests: 60, windowMs: 60 * 1000 },   // 60 req / 1 min
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  identifier: string,
  config: RateLimitConfig,
  handler: () => Promise<Response> | Response,
): Promise<Response> {
  const result = await rateLimiter.check(identifier, config)

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        resetAt: new Date(result.resetAt).toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        },
      },
    )
  }

  const response = await handler()

  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', String(config.maxRequests))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(result.resetAt))

  return response
}
