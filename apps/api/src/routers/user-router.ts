import { Hono } from "hono";
import { setPasswordSchema } from "shared/auth/password";
import { AUTH_CONFIG } from "shared/config/auth";
import { auth } from "../lib/auth";
import { checkUserHasPassword } from "../lib/user-credential";
import { zodValidator } from "../lib/validator";
import { type AuthMiddlewareEnv, authMiddleware } from "../middlewares/auth";
import type { LoggerMiddlewareEnv } from "../middlewares/logger";

/**
 * User router - handles user profile operations
 *
 * Routes:
 * - GET /user/profile - Get current user profile (includes hasPassword field)
 * - GET /user/has-password - Check if user has a password set (requires AUTH_CONFIG.emailPassword.enabled)
 * - POST /user/set-password - Set password for OAuth users (requires AUTH_CONFIG.emailPassword.enabled)
 *
 * Note: Password-related routes return 403/404 when AUTH_CONFIG.emailPassword.enabled is false
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

    // Check if user has a password (returns false if password auth is disabled)
    const hasPassword = await checkUserHasPassword(user.id);

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
      hasPassword,
    });
  })

  /**
   * Check if the current user has a password (credential account).
   */
  .get("/has-password", async (c) => {
    const logger = c.get("logger");

    // Return 404 if password authentication is disabled
    if (!AUTH_CONFIG.emailPassword.enabled) {
      logger.warn("Password check attempted but password auth is disabled");
      return c.json({ error: "Password authentication is not enabled" }, 404);
    }

    const user = c.var.user;
    logger.info(`Checking if user ${user.id} has a password`);

    try {
      const hasPassword = await checkUserHasPassword(user.id);
      return c.json({ hasPassword });
    } catch (error) {
      logger.error({ error }, "Error checking password status");
      return c.json({ error: "Failed to check password status" }, 500);
    }
  })

  /**
   * Set password for users who don't have one (OAuth users).
   * This endpoint will fail if the user already has a credential account.
   */
  .post("/set-password", zodValidator("json", setPasswordSchema({})), async (c) => {
    const logger = c.get("logger");

    // Return 403 if password authentication is disabled
    if (!AUTH_CONFIG.emailPassword.enabled) {
      logger.warn("Set password attempted but password auth is disabled");
      return c.json({ error: "Password authentication is not enabled" }, 403);
    }

    const user = c.var.user;
    const { newPassword } = c.req.valid("json");

    logger.info(`Setting password for user ${user.id}`);

    try {
      // Check if user already has a password
      const hasPassword = await checkUserHasPassword(user.id);

      if (hasPassword) {
        logger.warn(`User ${user.id} already has a password`);
        return c.json(
          { error: "User already has a password. Use change password instead." },
          400,
        );
      }

      const response = await auth.api.setPassword({
        body: { newPassword },
        headers: c.req.raw.headers,
      });

      if (!response.status) {
        logger.error("Failed to set password");
        return c.json({ error: "Failed to set password" }, 400);
      }

      return c.json({ success: true });
    } catch (error) {
      logger.error("Error setting password");
      logger.error(error);
      return c.json({ error: "Failed to set password" }, 500);
    }
  });

export { userRouter };
