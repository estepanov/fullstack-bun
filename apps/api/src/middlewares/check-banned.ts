import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { db } from "../db/client";
import { user as userTable } from "../db/schema";
import type { AuthMiddlewareEnv } from "./auth";

/**
 * Middleware to check if user is banned (for custom routes outside /auth)
 *
 * Usage:
 * ```typescript
 * const router = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
 *   .use(authMiddleware())
 *   .use(checkBannedMiddleware())
 *   .post("/chat/send", (c) => {
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

    // Fetch user to check banned field
    const userData = await db
      .select({
        banned: userTable.banned,
        banReason: userTable.banReason,
        banExpires: userTable.banExpires,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!userData) {
      throw new HTTPException(401, {
        message: "User not found",
        cause: "USER_NOT_FOUND",
      });
    }

    // Check if banned and not expired
    const isBanned =
      userData.banned && (!userData.banExpires || userData.banExpires > new Date());

    if (isBanned) {
      const message = userData.banReason
        ? `Your account has been banned. Reason: ${userData.banReason}`
        : "Your account has been banned";

      throw new HTTPException(403, {
        message,
        cause: "USER_BANNED",
      });
    }

    await next();
  });
