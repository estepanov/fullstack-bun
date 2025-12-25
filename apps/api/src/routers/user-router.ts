import { Hono } from "hono";
import { type AuthMiddlewareEnv, authMiddleware } from "../middlewares/auth";
import type { LoggerMiddlewareEnv } from "../middlewares/logger";

/**
 * User router - handles user profile operations
 *
 * Routes:
 * - GET /user/profile - Get current user profile
 */
const userRouter = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
  .use(authMiddleware())

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
      username: user.username,
      displayUsername: user.displayUsername,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

export { userRouter };
