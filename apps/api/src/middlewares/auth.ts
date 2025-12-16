import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth } from "../lib/auth";
import type { Session, User } from "better-auth/types";

export type AuthMiddlewareEnv = {
	Variables: {
		user: User;
		session: Session;
	};
};

/**
 * Auth middleware to protect routes
 *
 * Usage:
 * ```typescript
 * const router = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
 *   .get("/protected", authMiddleware(), (c) => {
 *     const user = c.var.user;
 *     const session = c.var.session;
 *     return c.json({ user });
 *   });
 * ```
 */
export const authMiddleware = () =>
	createMiddleware<AuthMiddlewareEnv>(async (c, next) => {
		// Get session from request
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}

		// Set user and session in context for type-safe access
		c.set("user", session.user);
		c.set("session", session.session);

		await next();
	});
