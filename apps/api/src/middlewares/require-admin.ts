import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { type UserRole, isAdmin } from "shared/auth/user-role";
import type { AuthMiddlewareEnv } from "./auth";

export const requireAdmin = () =>
  createMiddleware<AuthMiddlewareEnv>(async (c, next) => {
    if (!isAdmin(c.var.user.role as UserRole)) {
      throw new HTTPException(403, { message: "Forbidden", cause: "ROLE" });
    }

    await next();
  });
