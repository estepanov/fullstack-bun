/**
 * Rate limit preset configurations
 *
 * Each preset defines:
 * - windowMs: Time window in milliseconds
 * - limit: Maximum requests allowed in the window
 * - description: Use case for the preset
 */

export const RATE_LIMIT_PRESETS = {
  betterAuth: {
    windowMs: 60 * 1000, // 1 minute
    limit: 20,
    description: "Better Auth endpoints",
  },
  /**
   * Default rate limit for authenticated routes
   * 60 requests per minute
   */
  authenticated: {
    windowMs: 60 * 1000, // 1 minute
    limit: 60,
    description: "Default for authenticated routes",
  },
  notifications: {
    windowMs: 60 * 1000, // 1 minute
    limit: 120,
    description: "Default for notification routes",
  },

  /**
   * Default rate limit for unauthenticated routes
   * 20 requests per minute (more restrictive)
   */
  unauthenticated: {
    windowMs: 60 * 1000, // 1 minute
    limit: 20,
    description: "Default for unauthenticated routes",
  },

  /**
   * Generous rate limit for admin operations
   * 100 requests per minute
   */
  admin: {
    windowMs: 60 * 1000, // 1 minute
    limit: 100,
    description: "For admin routes",
  },

  /**
   * Moderate rate limit for notification creation
   * 30 requests per minute to prevent spam
   */
  notificationCreate: {
    windowMs: 60 * 1000, // 1 minute
    limit: 30,
    description: "Prevent notification spam",
  },

  /**
   * Restrictive rate limit for heavy operations
   * 10 requests per minute for file uploads, expensive operations
   */
  heavy: {
    windowMs: 60 * 1000, // 1 minute
    limit: 10,
    description: "File uploads, expensive operations",
  },
} as const;

export type RateLimitPreset = keyof typeof RATE_LIMIT_PRESETS;
