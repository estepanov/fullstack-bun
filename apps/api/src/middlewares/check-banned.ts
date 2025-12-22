import { and, eq, isNull } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { db } from "../db/client";
import { ban as banTable } from "../db/schema";
import type { AuthMiddlewareEnv } from "./auth";

/**
 * Middleware to check if user is banned
 *
 * Usage:
 * ```typescript
 * const router = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
 *   .use(authMiddleware())
 *   .use(checkBannedMiddleware())
 *   .get("/protected", (c) => {
 *     // User is authenticated and not banned
 *     return c.json({ user: c.var.user });
 *   });
 * ```
 *
 * Note: Must be used after authMiddleware()
 */
export const checkBannedMiddleware = () =>
  createMiddleware<AuthMiddlewareEnv>(async (c, next) => {
    const userId = c.var.user.id;

    // Check if user has an active ban (unbannedAt is null)
    const [activeBan] = await db
      .select({ reason: banTable.reason })
      .from(banTable)
      .where(and(eq(banTable.userId, userId), isNull(banTable.unbannedAt)))
      .limit(1);

    if (activeBan) {
      const message = activeBan.reason
        ? `Your account has been banned. Reason: ${activeBan.reason}`
        : "Your account has been banned";

      throw new HTTPException(403, {
        message,
        cause: "USER_BANNED",
      });
    }

    await next();
  });
