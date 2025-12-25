import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getMissingFields } from "../config/required-fields";
import type { AuthMiddlewareEnv } from "./auth";

export type ProfileCompleteMiddlewareEnv = AuthMiddlewareEnv & {
  Variables: {
    hasCompleteProfile: boolean;
  };
};

/**
 * Middleware to ensure user has completed all required profile fields.
 *
 * **Must be used after authMiddleware()** to access user data.
 *
 * Throws 403 Forbidden if user is missing required fields, with a structured
 * response containing the list of missing fields.
 *
 * @example
 * ```typescript
 * // Router-level protection (all routes require complete profile)
 * const router = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
 *   .use(authMiddleware())
 *   .use(checkProfileComplete())
 *   .get("/protected-action", (c) => { ... });
 *
 * // Route-level protection (specific routes require complete profile)
 * router.post(
 *   "/action",
 *   authMiddleware(),
 *   checkProfileComplete(),
 *   async (c) => { ... }
 * );
 * ```
 */
export const checkProfileComplete = () =>
  createMiddleware<ProfileCompleteMiddlewareEnv>(async (c, next) => {
    const user = c.var.user;

    // Check for missing required fields
    const missingFields = getMissingFields(user);

    if (missingFields.length > 0) {
      throw new HTTPException(403, {
        message: "Profile incomplete. Please complete your profile.",
        cause: "PROFILE_INCOMPLETE",
        res: new Response(
          JSON.stringify({
            error: "Profile incomplete",
            message: "Please complete your profile to continue",
            missingFields,
            requiredAction: "/profile/complete",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        ),
      });
    }

    // Set flag indicating profile is complete
    c.set("hasCompleteProfile", true);

    await next();
  });
