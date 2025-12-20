import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { db } from "../db/client";
import { user as userTable } from "../db/schema";
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
    const [user] = await db
      .select({ banned: userTable.banned, bannedReason: userTable.bannedReason })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user) {
      throw new HTTPException(401, { message: "Unauthorized", cause: "USER_NOT_FOUND" });
    }

    if (user.banned) {
      const message = user.bannedReason
        ? `Your account has been banned. Reason: ${user.bannedReason}`
        : "Your account has been banned";

      throw new HTTPException(403, {
        message,
        cause: "USER_BANNED",
      });
    }

    await next();
  });
