import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import {
  NotificationSSEEventType,
  createNotificationSchema,
  listNotificationsQuerySchema,
  markNotificationReadSchema,
  updatePreferencesSchema,
} from "shared/interfaces/notification";
import { notificationService } from "../lib/notification-service";
import { notificationSSEManager } from "../lib/notification-sse-manager";
import { zodValidator } from "../lib/validator";
import { type AuthMiddlewareEnv, authMiddleware } from "../middlewares/auth";
import { checkProfileComplete } from "../middlewares/check-profile-complete";
import type { LoggerMiddlewareEnv } from "../middlewares/logger";
import { requireAdmin } from "../middlewares/require-admin";

export const notificationRouter = new Hono<LoggerMiddlewareEnv & AuthMiddlewareEnv>()
  // SSE streaming endpoint
  .get("/stream", authMiddleware(), async (c) => {
    const logger = c.get("logger");
    const userId = c.var.user.id;

    return streamSSE(c, async (stream) => {
      const abortController = new AbortController();
      let clientId: string | null = null;

      // Set up client disconnect detection
      const disconnectPromise = new Promise<void>((resolve) => {
        // Listen for abort from our controller
        abortController.signal.addEventListener("abort", () => {
          logger.info({ userId, clientId }, "Abort signal received");
          resolve();
        });

        // Also listen for Hono stream abort (client disconnect)
        if (stream.onAbort) {
          stream.onAbort(() => {
            logger.info({ userId, clientId }, "Client disconnected (stream.onAbort)");
            abortController.abort();
            resolve();
          });
        }
      });

      try {
        logger.info({ userId }, "Notification SSE stream opened");

        // Add client to SSE manager
        clientId = notificationSSEManager.addClient({
          stream,
          userId,
          abortController,
        });

        if (!clientId) {
          // Server is shutting down
          await stream.writeSSE({
            event: NotificationSSEEventType.ERROR,
            data: JSON.stringify({
              type: NotificationSSEEventType.ERROR,
              error: "Server is shutting down",
            }),
          });
          return;
        }

        // Get unread count
        const unreadCount = await notificationService.getUnreadCount(userId);

        // Send CONNECTED event
        await stream.writeSSE({
          event: NotificationSSEEventType.CONNECTED,
          data: JSON.stringify({
            type: NotificationSSEEventType.CONNECTED,
            userId,
            unreadCount,
            timestamp: Date.now(),
          }),
        });

        // Wait for disconnect
        await disconnectPromise;
      } catch (error) {
        // Check if this is an abort (normal disconnect) or an actual error
        if (error instanceof Error && error.name === "AbortError") {
          logger.info({ userId, clientId }, "SSE stream aborted normally");
        } else {
          logger.error({ error, userId, clientId }, "SSE stream error");
        }
      } finally {
        if (clientId) {
          logger.info({ userId, clientId }, "SSE stream closed, cleaning up");
          notificationSSEManager.removeClient(clientId);
        }
      }
    });
  })

  // Heartbeat endpoint for optional client activity tracking
  .post("/heartbeat", authMiddleware(), async (c) => {
    const userId = c.var.user.id;
    notificationSSEManager.touchUser(userId);
    return c.json({ success: true, timestamp: Date.now() });
  })

  // Get paginated notifications list
  .get(
    "/list",
    authMiddleware(),
    checkProfileComplete(),
    zodValidator("query", listNotificationsQuerySchema),
    async (c) => {
      const logger = c.get("logger");
      const userId = c.var.user.id;

      try {
        const query = c.req.valid("query");
        const result = await notificationService.getNotifications(userId, query);

        return c.json({
          success: true,
          notifications: result.notifications,
          pagination: result.pagination,
        });
      } catch (error) {
        logger.error({ error, userId }, "Failed to fetch notifications");
        return c.json({ success: false, error: "Failed to fetch notifications" }, 500);
      }
    },
  )

  // Get unread count
  .get("/unread-count", authMiddleware(), async (c) => {
    const logger = c.get("logger");
    const userId = c.var.user.id;

    try {
      const unreadCount = await notificationService.getUnreadCount(userId);
      return c.json({ success: true, unreadCount });
    } catch (error) {
      logger.error({ error, userId }, "Failed to get unread count");
      return c.json({ success: false, error: "Failed to get unread count" }, 500);
    }
  })

  // Get notification counts for filters
  .get("/counts", authMiddleware(), async (c) => {
    const logger = c.get("logger");
    const userId = c.var.user.id;

    try {
      const counts = await notificationService.getNotificationCounts(userId);
      return c.json({ success: true, counts });
    } catch (error) {
      logger.error({ error, userId }, "Failed to get notification counts");
      return c.json({ success: false, error: "Failed to get notification counts" }, 500);
    }
  })

  // Create notification (admin only)
  .post(
    "/create",
    authMiddleware(),
    requireAdmin(),
    checkProfileComplete(),
    zodValidator("json", createNotificationSchema),
    async (c) => {
      const logger = c.get("logger");

      try {
        const request = c.req.valid("json");

        // Create notification (service will handle SSE broadcast and unread count update)
        const notification = await notificationService.createNotification(
          request,
          request.deliveryOptions,
        );

        logger.info(
          { notificationId: notification.id, userId: request.userId },
          "Notification created",
        );

        return c.json({ success: true, notification });
      } catch (error) {
        logger.error({ error }, "Failed to create notification");
        return c.json({ success: false, error: "Failed to create notification" }, 500);
      }
    },
  )

  // Mark notification as read/unread
  .patch(
    "/:id/read",
    authMiddleware(),
    checkProfileComplete(),
    zodValidator("json", markNotificationReadSchema),
    async (c) => {
      const notificationId = c.req.param("id");
      const logger = c.get("logger");
      const userId = c.var.user.id;

      try {
        const { read } = c.req.valid("json");

        // Get notification to check ownership
        const existing = await notificationService.getNotificationById(notificationId);

        if (!existing) {
          return c.json({ success: false, error: "Notification not found" }, 404);
        }

        if (existing.userId !== userId) {
          return c.json({ success: false, error: "Forbidden" }, 403);
        }

        // Update read status
        const updated = await notificationService.markNotificationRead(
          notificationId,
          read,
        );

        if (!updated) {
          return c.json({ success: false, error: "Failed to update notification" }, 500);
        }

        // Broadcast update
        notificationSSEManager.broadcastNotificationUpdate(updated);

        // Get updated unread count
        const unreadCount = await notificationService.getUnreadCount(userId);

        // Broadcast unread count change
        notificationSSEManager.broadcastUnreadCountChange(userId, unreadCount);

        logger.info({ notificationId, read }, "Notification read status updated");

        return c.json({ success: true, notification: updated });
      } catch (error) {
        logger.error({ error, notificationId }, "Failed to update notification");
        return c.json({ success: false, error: "Failed to update notification" }, 500);
      }
    },
  )

  // Mark all notifications as read
  .patch("/mark-all-read", authMiddleware(), checkProfileComplete(), async (c) => {
    const logger = c.get("logger");
    const userId = c.var.user.id;

    try {
      const updatedCount = await notificationService.markAllRead(userId);

      // Broadcast unread count change (now 0)
      notificationSSEManager.broadcastUnreadCountChange(userId, 0);

      logger.info({ userId, updatedCount }, "Marked all notifications as read");

      return c.json({ success: true, updatedCount });
    } catch (error) {
      logger.error({ error, userId }, "Failed to mark all notifications as read");
      return c.json({ success: false, error: "Failed to mark all as read" }, 500);
    }
  })

  // Delete all notifications (must come before /:id to avoid route conflict)
  .delete("/delete-all", authMiddleware(), checkProfileComplete(), async (c) => {
    const logger = c.get("logger");
    const userId = c.var.user.id;

    try {
      const deletedCount = await notificationService.deleteAllNotifications(userId);

      // Broadcast unread count change (now 0)
      notificationSSEManager.broadcastUnreadCountChange(userId, 0);

      logger.info({ userId, deletedCount }, "Deleted all notifications for user");

      return c.json({ success: true, deletedCount });
    } catch (error) {
      logger.error({ error, userId }, "Failed to delete all notifications");
      return c.json({ success: false, error: "Failed to delete all notifications" }, 500);
    }
  })

  // Delete notification
  .delete("/:id", authMiddleware(), checkProfileComplete(), async (c) => {
    const notificationId = c.req.param("id");
    const logger = c.get("logger");
    const userId = c.var.user.id;

    try {
      // Get notification to check ownership
      const existing = await notificationService.getNotificationById(notificationId);

      if (!existing) {
        return c.json({ success: false, error: "Notification not found" }, 404);
      }

      if (existing.userId !== userId) {
        return c.json({ success: false, error: "Forbidden" }, 403);
      }

      // Delete notification
      const deleted = await notificationService.deleteNotification(notificationId);

      if (!deleted) {
        return c.json({ success: false, error: "Notification not found" }, 404);
      }

      // Broadcast deletion
      notificationSSEManager.broadcastNotificationDeletion(notificationId, userId);

      // Get updated unread count
      const unreadCount = await notificationService.getUnreadCount(userId);

      // Broadcast unread count change
      notificationSSEManager.broadcastUnreadCountChange(userId, unreadCount);

      logger.info({ notificationId }, "Notification deleted");

      return c.json({ success: true, notificationId });
    } catch (error) {
      logger.error({ error, notificationId }, "Failed to delete notification");
      return c.json({ success: false, error: "Failed to delete notification" }, 500);
    }
  })

  // Get notification preferences
  .get("/preferences", authMiddleware(), async (c) => {
    const logger = c.get("logger");
    const userId = c.var.user.id;

    try {
      const preferences = await notificationService.getOrCreatePreferences(userId);
      return c.json({ success: true, preferences });
    } catch (error) {
      logger.error({ error, userId }, "Failed to get notification preferences");
      return c.json({ success: false, error: "Failed to get preferences" }, 500);
    }
  })

  // Update notification preferences
  .patch(
    "/preferences",
    authMiddleware(),
    zodValidator("json", updatePreferencesSchema),
    async (c) => {
      const logger = c.get("logger");
      const userId = c.var.user.id;

      try {
        const updates = c.req.valid("json");
        const preferences = await notificationService.updatePreferences(userId, updates);

        logger.info({ userId, updates }, "Notification preferences updated");

        return c.json({ success: true, preferences });
      } catch (error) {
        logger.error({ error, userId }, "Failed to update notification preferences");
        return c.json({ success: false, error: "Failed to update preferences" }, 500);
      }
    },
  );
