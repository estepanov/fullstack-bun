import { zValidator } from "@hono/zod-validator";
import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { updateUserRoleSchema } from "shared/auth/user-role";
import { db } from "../db/client";
import { user } from "../db/schema";
import { type AuthMiddlewareEnv, authMiddleware } from "../middlewares/auth";
import type { LoggerMiddlewareEnv } from "../middlewares/logger";
import { requireAdmin } from "../middlewares/require-admin";

const adminRouter = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
  .use(authMiddleware(), requireAdmin())
  .get("/users", async (c) => {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .orderBy(asc(user.createdAt));

    return c.json({ users });
  })
  .patch("/users/:id/role", zValidator("json", updateUserRoleSchema), async (c) => {
    const id = c.req.param("id");
    const { role } = c.req.valid("json");

    const updated = await db.update(user).set({ role }).where(eq(user.id, id)).returning({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    const updatedUser = updated[0];
    if (!updatedUser) return c.json({ message: "User not found" }, 404);

    return c.json({ user: updatedUser });
  });

export { adminRouter };
