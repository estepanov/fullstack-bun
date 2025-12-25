import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { updateUserRoleSchema } from "shared/auth/user-role";
import { ChatWSMessageType } from "shared/interfaces/chat";
import { db } from "../db/client";
import { user } from "../db/schema";
import { chatManager } from "../lib/chat-manager";
import { chatService } from "../lib/chat-service";
import { type AuthMiddlewareEnv, authMiddleware } from "../middlewares/auth";
import { checkProfileComplete } from "../middlewares/check-profile-complete";
import type { LoggerMiddlewareEnv } from "../middlewares/logger";
import { requireAdmin } from "../middlewares/require-admin";

const adminRouter = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
  .use(authMiddleware(), requireAdmin(), checkProfileComplete())
  .patch("/users/:id/role", zValidator("json", updateUserRoleSchema), async (c) => {
    const logger = c.get("logger");

    try {
      const targetUserId = c.req.param("id");
      const { role } = c.req.valid("json");
      const adminUserId = c.var.user.id;

      logger.info(
        `Setting role for user ${targetUserId} to ${role} by admin ${adminUserId}`,
      );

      // Update user role
      const [updatedUser] = await db
        .update(user)
        .set({ role })
        .where(eq(user.id, targetUserId))
        .returning();

      if (!updatedUser) {
        return c.json({ success: false, error: "User not found" }, 404);
      }

      logger.info(`Successfully updated role for user ${targetUserId} to ${role}`);

      return c.json({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to update user role");
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  })
  // Delete all messages from a user
  .delete("/users/:id/messages", async (c) => {
    const logger = c.get("logger");

    try {
      const targetUserId = c.req.param("id");
      const adminUserId = c.var.user.id;

      logger.info(
        `Deleting all messages for user: ${targetUserId} by admin: ${adminUserId}`,
      );

      // Delete all user's messages
      const deletedCount = await chatService.deleteMessagesByUserId(targetUserId);
      logger.info(`Deleted ${deletedCount} messages for user ${targetUserId}`);

      // Notify all connected clients about the bulk deletion
      if (deletedCount > 0) {
        chatManager.broadcast({
          type: ChatWSMessageType.BULK_DELETE,
          userId: targetUserId,
          deletedCount,
        });
      }

      return c.json({
        success: true,
        deletedCount,
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to delete user messages");
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  });

export { adminRouter };
