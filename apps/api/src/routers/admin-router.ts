import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { Hono } from "hono";
import { updateUserRoleSchema } from "shared/auth/user-role";
import { PAGINATION_CONFIG } from "shared/config/pagination";
import { ChatWSMessageType } from "shared/interfaces/chat";
import { adminSendNotificationSchema } from "shared/interfaces/notification";
import { z } from "zod";
import { db } from "../db/client";
import { user } from "../db/schema";
import { chatManager } from "../lib/chat-manager";
import { chatService } from "../lib/chat-service";
import { notificationService } from "../lib/notification-service";
import { zodValidator } from "../lib/validator";
import { type AuthMiddlewareEnv, authMiddleware } from "../middlewares/auth";
import { checkProfileComplete } from "../middlewares/check-profile-complete";
import type { LoggerMiddlewareEnv } from "../middlewares/logger";
import { requireAdmin } from "../middlewares/require-admin";

// Schema for pagination query parameters
const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION_CONFIG.maxPageSize)
    .default(PAGINATION_CONFIG.defaultPageSize),
  q: z.string().trim().min(2).max(100).optional(),
});

const userSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

const MAX_NOTIFICATION_RECIPIENTS = 10000;
const NOTIFICATION_SEND_BATCH_SIZE = 50;

const chunkArray = <T>(items: T[], size: number): T[][] => {
  if (items.length <= size) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const adminRouter = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
  .use(authMiddleware(), requireAdmin(), checkProfileComplete())
  .get("/users", zodValidator("query", paginationQuerySchema), async (c) => {
    const logger = c.get("logger");

    try {
      const { page, limit, q } = c.req.valid("query");
      const offset = (page - 1) * limit;
      const trimmedQuery = q?.trim();
      const searchPattern =
        trimmedQuery && trimmedQuery.length >= 2 ? `%${trimmedQuery}%` : null;

      logger.info(
        `Fetching users - page: ${page}, limit: ${limit}, query: ${trimmedQuery ?? ""}`,
      );

      const whereClause = searchPattern
        ? or(ilike(user.email, searchPattern), ilike(user.name, searchPattern))
        : undefined;

      // Get total count
      const [{ value: totalCount }] = await db
        .select({ value: count() })
        .from(user)
        .where(whereClause);

      // Get paginated users
      const users = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          role: user.role,
          banned: user.banned,
          banReason: user.banReason,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .where(whereClause)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(totalCount / limit);

      return c.json({
        success: true,
        users,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch users");
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  })
  .get("/users/search", zodValidator("query", userSearchQuerySchema), async (c) => {
    const logger = c.get("logger");

    try {
      const { q, limit } = c.req.valid("query");
      const normalizedQuery = `%${q}%`;

      const users = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(
          and(
            eq(user.banned, false),
            or(ilike(user.email, normalizedQuery), ilike(user.name, normalizedQuery)),
          ),
        )
        .orderBy(desc(user.createdAt))
        .limit(limit);

      return c.json({ success: true, users });
    } catch (error) {
      logger.error({ err: error }, "Failed to search users");
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  })
  .get("/users/banned", zodValidator("query", paginationQuerySchema), async (c) => {
    const logger = c.get("logger");

    try {
      const { page, limit } = c.req.valid("query");
      const offset = (page - 1) * limit;

      logger.info(`Fetching banned users - page: ${page}, limit: ${limit}`);

      // Get total count of banned users
      const [{ value: totalCount }] = await db
        .select({ value: count() })
        .from(user)
        .where(eq(user.banned, true));

      // Get paginated banned users
      const bannedUsers = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          banned: user.banned,
          banReason: user.banReason,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .where(eq(user.banned, true))
        .orderBy(desc(user.updatedAt))
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(totalCount / limit);

      return c.json({
        success: true,
        bans: bannedUsers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch banned users");
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  })
  .post(
    "/notifications/send",
    zodValidator("json", adminSendNotificationSchema),
    async (c) => {
      const logger = c.get("logger");
      const adminUserId = c.var.user.id;

      try {
        const request = c.req.valid("json");
        const { notification, target } = request;

        let targetUsers: Array<{ id: string; email: string | null }> = [];

        if (target.scope === "all") {
          targetUsers = await db
            .select({ id: user.id, email: user.email })
            .from(user)
            .where(eq(user.banned, false))
            .limit(MAX_NOTIFICATION_RECIPIENTS + 1);

          if (targetUsers.length > MAX_NOTIFICATION_RECIPIENTS) {
            return c.json(
              {
                success: false,
                error: "Recipient limit exceeded",
              },
              413,
            );
          }
        } else {
          const identifiers =
            target.scope === "user" ? [target.identifier] : target.identifiers;
          const normalized = identifiers
            .map((identifier) => identifier.trim())
            .filter(Boolean);
          const deduped = Array.from(new Set(normalized));

          if (deduped.length > MAX_NOTIFICATION_RECIPIENTS) {
            return c.json(
              {
                success: false,
                error: "Recipient limit exceeded",
              },
              413,
            );
          }

          targetUsers = await db
            .select({ id: user.id, email: user.email })
            .from(user)
            .where(
              and(
                eq(user.banned, false),
                or(inArray(user.id, deduped), inArray(user.email, deduped)),
              ),
            );
        }

        const targetUserIds = targetUsers.map((entry) => entry.id);
        const targetCount = targetUserIds.length;

        if (targetCount === 0) {
          return c.json({
            success: true,
            targetCount: 0,
            createdCount: 0,
            skippedCount: 0,
            failures: [],
          });
        }

        const failures: Array<{ identifier: string; reason: string }> = [];
        if (target.scope !== "all") {
          const identifiers =
            target.scope === "user" ? [target.identifier] : target.identifiers;
          const normalized = identifiers
            .map((identifier) => identifier.trim())
            .filter(Boolean);
          const foundIdentifiers = new Set(
            targetUsers.flatMap(
              (entry) => [entry.id, entry.email].filter(Boolean) as string[],
            ),
          );
          for (const identifier of normalized) {
            if (!foundIdentifiers.has(identifier)) {
              failures.push({ identifier, reason: "User not found or banned" });
            }
          }
        }

        const { deliveryOptions, ...notificationPayload } = notification;

        let createdCount = 0;
        const batches = chunkArray(targetUserIds, NOTIFICATION_SEND_BATCH_SIZE);
        for (const batch of batches) {
          const results = await Promise.allSettled(
            batch.map(async (userId) =>
              notificationService.createNotification(
                {
                  userId,
                  ...notificationPayload,
                },
                deliveryOptions,
              ),
            ),
          );

          results.forEach((result, index) => {
            if (result.status === "fulfilled") {
              createdCount += 1;
              return;
            }

            failures.push({
              identifier: batch[index],
              reason:
                result.reason instanceof Error ? result.reason.message : "Failed to send",
            });
          });
        }

        logger.info(
          {
            adminUserId,
            targetCount,
            createdCount,
            failures: failures.length,
          },
          "Admin notification send completed",
        );

        return c.json({
          success: true,
          targetCount,
          createdCount,
          skippedCount: targetCount - createdCount,
          failures,
        });
      } catch (error) {
        logger.error({ err: error, adminUserId }, "Failed to send admin notifications");
        return c.json(
          {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          },
          500,
        );
      }
    },
  )
  .patch("/users/:id/role", zodValidator("json", updateUserRoleSchema), async (c) => {
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
