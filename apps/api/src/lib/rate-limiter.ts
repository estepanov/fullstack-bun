import type { Context, MiddlewareHandler } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { RATE_LIMIT_PRESETS, type RateLimitPreset } from "../config/rate-limits";
import { extractClientIp } from "./ip-extraction";
import { createRedisRateLimitStore } from "./rate-limiter-store";
import { redis } from "./redis";

/**
 * Configuration options for creating a rate limiter
 */
export interface RateLimiterOptions {
  /**
   * Use a predefined preset configuration
   * If provided, preset values are used unless overridden by custom options
   */
  preset?: RateLimitPreset;

  /**
   * Time window in milliseconds
   * Overrides preset if provided
   */
  windowMs?: number;

  /**
   * Maximum number of requests allowed in the window
   * Overrides preset if provided
   */
  limit?: number;

  /**
   * Custom key prefix for Redis storage
   * Default: "rate-limit:"
   */
  keyPrefix?: string;

  /**
   * Custom key generator function
   * If not provided, uses smart key generation (user ID vs IP)
   */
  keyGenerator?: (c: Context) => string;
}

/**
 * Smart key generator that automatically detects authentication state
 *
 * Strategy:
 * - Authenticated requests: key = "prefix:user:{userId}"
 *   Prevents users from bypassing limits by changing IPs
 *
 * - Unauthenticated requests: key = "prefix:ip:{ipAddress}"
 *   Rate limits by IP to prevent DDoS and brute force
 *
 * @param prefix - Key prefix (e.g., "rate-limit:")
 * @returns Key generator function
 */
const createSmartKeyGenerator = (prefix: string) => {
  return (c: Context): string => {
    // Check if user is authenticated via Better Auth
    // Better Auth sets c.var.user when authenticated
    const user = c.var?.user;

    if (user?.id) {
      // Authenticated: use user ID to prevent IP rotation attacks
      return `${prefix}user:${user.id}`;
    }

    // Unauthenticated: use IP address
    const ip = extractClientIp(c);
    return `${prefix}ip:${ip}`;
  };
};

/**
 * Custom handler for rate limit exceeded errors
 *
 * Throws HTTPException with 429 status and detailed information:
 * - message: "Too many requests"
 * - cause: { retryAfter, limit, remaining }
 *
 * @param c - Hono context
 * @param retryAfter - Seconds until the rate limit resets
 * @param limit - Maximum requests allowed in window
 * @param remaining - Requests remaining (always 0 when this is called)
 */
const applyLegacyRateLimitHeaders = (c: Context) => {
  const limitHeader = c.res.headers.get("RateLimit-Limit");
  const remainingHeader = c.res.headers.get("RateLimit-Remaining");
  const resetHeader = c.res.headers.get("RateLimit-Reset");

  if (limitHeader && !c.res.headers.has("X-RateLimit-Limit")) {
    c.res.headers.set("X-RateLimit-Limit", limitHeader);
  }
  if (remainingHeader && !c.res.headers.has("X-RateLimit-Remaining")) {
    c.res.headers.set("X-RateLimit-Remaining", remainingHeader);
  }
  if (resetHeader && !c.res.headers.has("X-RateLimit-Reset")) {
    c.res.headers.set("X-RateLimit-Reset", resetHeader);
  }
};

const handleRateLimitExceeded = (
  c: Context,
  retryAfter: number,
  limit: number,
  remaining: number,
  resetAt: number,
): Response => {
  c.header("Retry-After", String(retryAfter));
  c.header("RateLimit-Limit", String(limit));
  c.header("RateLimit-Remaining", String(remaining));
  c.header("RateLimit-Reset", String(resetAt));
  c.header("X-RateLimit-Limit", String(limit));
  c.header("X-RateLimit-Remaining", String(remaining));
  c.header("X-RateLimit-Reset", String(resetAt));

  return c.json(
    {
      message: "Too many requests",
      cause: {
        retryAfter,
        limit,
        remaining,
      },
    },
    429,
  );
};

/**
 * Creates a rate limiter middleware with smart key generation
 *
 * Features:
 * - Automatic user ID vs IP detection
 * - Redis-backed distributed rate limiting
 * - Standard rate limit headers (draft-7)
 * - 429 responses with retry information
 * - Preset configurations
 * - Custom configuration support
 *
 * @param options - Configuration options or preset name
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * // Use preset
 * app.use("/api/auth/*", createRateLimiter({ preset: "auth" }));
 *
 * // Custom configuration
 * app.use("/api/upload", createRateLimiter({
 *   windowMs: 60 * 1000,
 *   limit: 5,
 * }));
 *
 * // Override preset
 * app.use("/api/heavy", createRateLimiter({
 *   preset: "heavy",
 *   limit: 5, // Override preset's limit
 * }));
 * ```
 *
 * Response Headers:
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Requests remaining in window
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 * - Retry-After: Seconds until retry (on 429)
 *
 * Error Response (429):
 * ```json
 * {
 *   "message": "Too many requests",
 *   "cause": {
 *     "retryAfter": 30,
 *     "limit": 60,
 *     "remaining": 0
 *   }
 * }
 * ```
 */
export const createRateLimiter = (
  options: RateLimiterOptions = {},
): MiddlewareHandler => {
  const keyPrefix = options.keyPrefix
    ? `${options.keyPrefix}-rate-limit:`
    : "rate-limit:";

  // Get preset configuration if specified
  const presetConfig = options.preset ? RATE_LIMIT_PRESETS[options.preset] : null;

  // Determine final configuration (custom options override preset)
  const windowMs = options.windowMs ?? presetConfig?.windowMs ?? 60 * 1000;
  const limit = options.limit ?? presetConfig?.limit ?? 60;

  // Use custom key generator or smart key generator
  const keyGenerator = options.keyGenerator || createSmartKeyGenerator(keyPrefix);

  // Create Redis store
  const store = createRedisRateLimitStore(redis, keyPrefix);

  const limiter = rateLimiter({
    windowMs,
    limit,
    standardHeaders: "draft-6", // draft-6 uses RateLimit-* headers
    keyGenerator,
    store,
    handler: (c) => {
      // Calculate retry-after from window
      const retryAfter = Math.ceil(windowMs / 1000);
      const resetAt = Math.ceil(Date.now() / 1000 + retryAfter);
      return handleRateLimitExceeded(c, retryAfter, limit, 0, resetAt);
    },
  });

  // Create and return the rate limiter middleware
  return async (c, next) => {
    const response = await limiter(c, async () => {
      await next();
    });
    applyLegacyRateLimitHeaders(c);
    return response;
  };
};
