import { createRateLimiter, type RateLimiterOptions } from "../lib/rate-limiter";

/**
 * Rate limiting middleware factory
 *
 * Creates a rate limiter middleware following the existing middleware pattern.
 * This is a simple re-export for consistency with other middleware files.
 *
 * @param options - Rate limiter configuration options
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * import { rateLimitMiddleware } from "./middlewares/rate-limit";
 *
 * // Use preset
 * app.use("/api/auth/*", rateLimitMiddleware({ preset: "auth" }));
 *
 * // Custom configuration
 * app.use("/api/upload", rateLimitMiddleware({
 *   windowMs: 60 * 1000,
 *   limit: 5,
 * }));
 * ```
 */
export const rateLimitMiddleware = (options?: RateLimiterOptions) => {
  return createRateLimiter(options);
};
