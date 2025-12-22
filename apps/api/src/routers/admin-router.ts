import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { updateUserRoleSchema } from "shared/auth/user-role";
import { banUserSchema, getBannedUsersSchema } from "shared/auth/user-ban";
import { ChatWSMessageType } from "shared/interfaces/chat";
import { db } from "../db/client";
import { ban, user } from "../db/schema";
import { type AuthMiddlewareEnv, authMiddleware } from "../middlewares/auth";
import type { LoggerMiddlewareEnv } from "../middlewares/logger";
import { requireAdmin } from "../middlewares/require-admin";
import { chatService } from "../lib/chat-service";
import { chatManager } from "../lib/chat-manager";

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
        banned: sql<boolean>`(${ban.id} is not null)`,
        bannedAt: ban.createdAt,
      })
      .from(user)
      .leftJoin(ban, and(eq(ban.userId, user.id), isNull(ban.unbannedAt)))
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
  })
  .post("/users/:id/ban", zValidator("json", banUserSchema), async (c) => {
    const logger = c.get("logger");

    try {
      const targetUserId = c.req.param("id");
      const adminUserId = c.var.user.id;
      const { reason, deleteMessages } = c.req.valid("json");

      logger.info(`Ban request: targetUserId=${targetUserId}, adminUserId=${adminUserId}, deleteMessages=${deleteMessages}`);

      // Prevent self-ban
      if (targetUserId === adminUserId) {
        return c.json({ message: "Cannot ban yourself" }, 400);
      }

      // Check if user exists
      const existingUser = await db.query.user.findFirst({
        where: eq(user.id, targetUserId),
      });

      if (!existingUser) {
        logger.warn(`User not found: ${targetUserId}`);
        return c.json({ message: "User not found" }, 404);
      }

      if (existingUser.role === "ADMIN") {
        logger.warn(`Attempted to ban admin user: ${targetUserId}`);
        return c.json({ message: "Cannot ban admin users" }, 400);
      }

      // Check if user is already banned (has an active ban)
      const existingBan = await db.query.ban.findFirst({
        where: (ban, { eq, and, isNull }) =>
          and(eq(ban.userId, targetUserId), isNull(ban.unbannedAt)),
      });

      if (existingBan) {
        logger.warn(`User is already banned: ${targetUserId}`);
        return c.json({ message: "User is already banned" }, 400);
      }

      // Create ban record
      const newBan = await db
        .insert(ban)
        .values({
          id: uuidv4(),
          userId: targetUserId,
          bannedBy: adminUserId,
          reason: reason || null,
        })
        .returning();

      const createdBan = newBan[0];
      logger.info(`User banned successfully: ${targetUserId}`);

      // Delete all user's messages if requested
      let deletedMessagesCount = 0;
      if (deleteMessages) {
        try {
          deletedMessagesCount = await chatService.deleteMessagesByUserId(targetUserId);
          logger.info(`Deleted ${deletedMessagesCount} messages for user ${targetUserId}`);

          // Notify all connected clients about the deletions
          if (deletedMessagesCount > 0) {
            chatManager.broadcast({
              type: ChatWSMessageType.BULK_DELETE,
              userId: targetUserId,
              deletedCount: deletedMessagesCount,
            });
          }
        } catch (error) {
          logger.error({ err: error }, "Error deleting messages");
          // Continue even if message deletion fails
        }
      }

      // Disconnect user's active WebSocket connections
      try {
        chatManager.disconnectUser(targetUserId);
      } catch (error) {
        logger.error({ err: error }, "Error disconnecting user");
        // Continue even if disconnect fails
      }

      return c.json({
        ban: createdBan,
        user: existingUser,
        deletedMessagesCount,
      });
    } catch (error) {
      logger.error({ err: error }, "Ban user error");
      return c.json({
        message: "Failed to ban user",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, 500);
    }
  })
  .post("/users/:id/unban", async (c) => {
    const logger = c.get("logger");

    try {
      const targetUserId = c.req.param("id");
      const adminUserId = c.var.user.id;
      logger.info(`Unbanning user: ${targetUserId}`);

      // Find the active ban
      const activeBan = await db.query.ban.findFirst({
        where: (ban, { eq, and, isNull }) =>
          and(eq(ban.userId, targetUserId), isNull(ban.unbannedAt)),
      });

      if (!activeBan) {
        logger.warn(`No active ban found for user: ${targetUserId}`);
        return c.json({ message: "User is not banned" }, 404);
      }

      // Update the ban record to mark it as unbanned
      const updated = await db
        .update(ban)
        .set({
          unbannedAt: new Date(),
          unbannedBy: adminUserId,
        })
        .where(eq(ban.id, activeBan.id))
        .returning();

      const updatedBan = updated[0];

      logger.info(`User unbanned successfully: ${targetUserId}`);
      return c.json({ ban: updatedBan });
    } catch (error) {
      logger.error({ err: error }, "Failed to unban user");
      return c.json({
        message: "Failed to unban user",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, 500);
    }
  })
  .get("/bans", zValidator("query", getBannedUsersSchema), async (c) => {
    const logger = c.get("logger");

    try {
      const { page, limit, sortBy, sortOrder } = c.req.valid("query");
      const offset = (page - 1) * limit;

      logger.info(`Fetching banned users: page=${page}, limit=${limit}, sortBy=${sortBy}, sortOrder=${sortOrder}`);

      // Build the query to get active bans with user and admin info
      const bansQuery = db.query.ban.findMany({
        where: (ban, { isNull }) => isNull(ban.unbannedAt),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
              createdAt: true,
            },
          },
          admin: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        limit,
        offset,
      });

      logger.info("Executing paginated query for banned users");
      const bans = await bansQuery;
      logger.info(`Found ${bans.length} banned users in this page`);

      // Apply sorting (done in-memory for now, can be optimized with raw SQL if needed)
      const sortedBans = [...bans].sort((a, b) => {
        let aVal: string | Date | null;
        let bVal: string | Date | null;

        if (sortBy === "name") {
          aVal = a.user.name;
          bVal = b.user.name;
        } else if (sortBy === "email") {
          aVal = a.user.email;
          bVal = b.user.email;
        } else {
          aVal = a.createdAt;
          bVal = b.createdAt;
        }

        if (aVal === null) return 1;
        if (bVal === null) return -1;

        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortOrder === "asc" ? comparison : -comparison;
      });

      // Format the response
      const bansWithDetails = sortedBans.map((banRecord) => ({
        id: banRecord.user.id,
        name: banRecord.user.name,
        email: banRecord.user.email,
        image: banRecord.user.image,
        banned: true,
        bannedAt: banRecord.createdAt,
        bannedBy: banRecord.bannedBy,
        bannedByName: banRecord.admin?.name || "Unknown",
        bannedReason: banRecord.reason,
        createdAt: banRecord.user.createdAt,
      }));

      // Get actual total count
      logger.info("Fetching total count of banned users");
      const allBans = await db.query.ban.findMany({
        where: (ban, { isNull }) => isNull(ban.unbannedAt),
      });
      const totalCount = allBans.length;
      logger.info(`Total banned users: ${totalCount}`);

      return c.json({
        bans: bansWithDetails,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch banned users");
      return c.json({
        message: "Failed to fetch banned users",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, 500);
    }
  });

export { adminRouter };
