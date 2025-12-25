import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { completeProfileSchema } from "shared/auth/user-profile";
import { db } from "../db/client";
import { user as userTable } from "../db/schema";
import { type AuthMiddlewareEnv, authMiddleware } from "../middlewares/auth";
import type { LoggerMiddlewareEnv } from "../middlewares/logger";

/**
 * User router - handles user profile operations
 *
 * Routes:
 * - PATCH /user/profile/complete - Complete profile with missing required fields
 * - GET /user/profile - Get current user profile
 */
const userRouter = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
  .use(authMiddleware())

  /**
   * Complete user profile with missing required fields.
   *
   * This endpoint does NOT require checkProfileComplete() middleware
   * to avoid chicken-and-egg problem.
   */
  .patch("/profile/complete", zValidator("json", completeProfileSchema), async (c) => {
    const logger = c.get("logger");
    const userId = c.var.user.id;
    const { name } = c.req.valid("json");

    try {
      logger.info(`Completing profile for user ${userId}`);

      // Update user profile
      const [updatedUser] = await db
        .update(userTable)
        .set({ name })
        .where(eq(userTable.id, userId))
        .returning();

      if (!updatedUser) {
        return c.json({ success: false, error: "User not found" }, 404);
      }

      logger.info(`Profile completed for user ${userId}`);

      return c.json({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          emailVerified: updatedUser.emailVerified,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to complete profile");
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update profile",
        },
        500,
      );
    }
  })

  /**
   * Get current user profile.
   */
  .get("/profile", async (c) => {
    const user = c.var.user;
    const logger = c.get("logger");

    logger.info(`Fetching profile for user ${user.id}`);

    return c.json({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

export { userRouter };
