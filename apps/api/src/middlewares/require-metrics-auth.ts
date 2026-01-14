import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { type UserRole, isAdmin } from "shared/auth/user-role";
import { env } from "../env";
import { auth } from "../lib/auth";

/**
 * Middleware to protect /metrics endpoint
 *
 * Allows access via:
 * 1. Admin users (authenticated via session)
 * 2. API key (Bearer token via Authorization header)
 *
 * Usage:
 * ```typescript
 * app.get("/metrics", requireMetricsAuth(), async (c) => {
 *   return c.json({ ... });
 * });
 * ```
 */
export const requireMetricsAuth = () =>
  createMiddleware(async (c, next) => {
    // Option 1: Allow authenticated admin users
    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (session && isAdmin(session.user.role as UserRole)) {
        await next();
        return;
      }
    } catch {
      // Session check failed, try API key
    }

    // Option 2: Require API key via Bearer token
    if (!env.METRICS_API_KEY) {
      throw new HTTPException(503, {
        message: "Metrics authentication not configured",
      });
    }

    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      throw new HTTPException(401, {
        message: "Unauthorized - Admin authentication or API key required",
      });
    }

    const providedKey = authHeader.replace(/^Bearer\s+/i, "");

    if (providedKey !== env.METRICS_API_KEY) {
      throw new HTTPException(401, {
        message: "Unauthorized - Invalid API key",
      });
    }

    await next();
  });
