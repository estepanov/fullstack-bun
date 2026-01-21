import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import {
  DELIVERY_STRATEGY_PRIORITY,
  NOTIFICATION_CONFIG,
} from "shared/config/notification";
import type {
  CreateNotificationRequest,
  ListNotificationsQuery,
  Notification,
  NotificationDeliveryOptions,
  NotificationMetadata,
  NotificationType,
} from "shared/interfaces/notification";
import { notificationMetadataSchema } from "shared/interfaces/notification";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/client";
import {
  notificationPreferences as notificationPreferencesTable,
  notification as notificationTable,
} from "../db/schema";
import { appLogger } from "../utils/logger";
import type { NotificationDeliveryStrategy } from "./notification-delivery-strategy";
import { redis } from "./redis";

/**
 * Redis key prefix for notification caching
 */
const UNREAD_COUNT_CACHE_PREFIX = "notification:unread:";

/**
 * Notification service - handles all notification business logic
 * - Creates and manages notifications in the database
 * - Caches unread counts in Redis
 * - Orchestrates delivery via multiple strategies (WebSocket, Email, Push)
 */
export class NotificationService {
  private static readonly METADATA_PROTO_BLACKLIST = new Set([
    "__proto__",
    "prototype",
    "constructor",
  ]);

  private deliveryStrategies: NotificationDeliveryStrategy[] = [];
  private unreadCountBroadcastFn?: (userId: string, count: number) => void;

  /**
   * Register a delivery strategy
   */
  registerDeliveryStrategy(strategy: NotificationDeliveryStrategy): void {
    this.deliveryStrategies.push(strategy);
    appLogger.info(
      { strategyName: strategy.name },
      "Registered notification delivery strategy",
    );
  }

  /**
   * Set unread count broadcast function (for SSE updates)
   */
  setUnreadCountBroadcast(fn: (userId: string, count: number) => void): void {
    this.unreadCountBroadcastFn = fn;
  }

  /**
   * Create a new notification
   * @param request - Notification data
   * @param options - Delivery options (immediate delivery, strategy override)
   * @returns The created notification
   */
  async createNotification(
    request: CreateNotificationRequest,
    options?: NotificationDeliveryOptions,
  ): Promise<Notification> {
    try {
      const now = new Date();
      const notificationId = uuidv4();

      // Prepare metadata
      const metadata = request.metadata || {};
      const metadataJson = JSON.stringify(metadata);

      // Insert into database
      const [created] = await db
        .insert(notificationTable)
        .values({
          id: notificationId,
          userId: request.userId,
          type: request.type,
          title: request.title,
          content: request.content,
          metadata: metadataJson,
          read: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!created) {
        throw new Error("Failed to create notification");
      }

      // Map to Notification type
      const notification = this.mapToNotification(created);

      // Invalidate unread count cache
      await this.invalidateUnreadCountCache(request.userId);

      // Deliver notification if immediate delivery is enabled (default: true)
      const deliveryOptions = options || { immediate: true };
      if (deliveryOptions.immediate !== false) {
        await this.deliverNotification(notification, deliveryOptions);
      }

      // Broadcast updated unread count to connected clients
      if (this.unreadCountBroadcastFn) {
        const unreadCount = await this.getUnreadCount(request.userId);
        this.unreadCountBroadcastFn(request.userId, unreadCount);
      }

      appLogger.info(
        { notificationId, userId: request.userId, type: request.type },
        "Notification created successfully",
      );

      return notification;
    } catch (error) {
      appLogger.error({ error, request }, "Failed to create notification");
      throw error;
    }
  }

  /**
   * Get paginated notifications for a user
   * @param userId - User ID
   * @param query - Pagination and filter options
   * @returns Paginated notifications and metadata
   */
  async getNotifications(
    userId: string,
    query: ListNotificationsQuery,
  ): Promise<{
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    try {
      const { page, limit, filter, type, search } = query;
      const offset = (page - 1) * limit;

      // Build where clause based on filter
      let whereClause = eq(notificationTable.userId, userId);

      if (filter === "read") {
        whereClause = and(whereClause, eq(notificationTable.read, true)) ?? whereClause;
      } else if (filter === "unread") {
        whereClause = and(whereClause, eq(notificationTable.read, false)) ?? whereClause;
      }

      if (type) {
        whereClause = and(whereClause, eq(notificationTable.type, type)) ?? whereClause;
      }

      const trimmedSearch = search?.trim();
      if (trimmedSearch) {
        const sanitizedSearch = trimmedSearch.replace(/[%_\\]/g, "");
        if (sanitizedSearch.length > 0) {
          const pattern = `%${sanitizedSearch}%`;
          whereClause =
            and(
              whereClause,
              or(
                ilike(notificationTable.title, pattern),
                ilike(notificationTable.content, pattern),
              ),
            ) ?? whereClause;
        }
      }

      // Get total count
      const [{ value: totalCount }] = await db
        .select({ value: count() })
        .from(notificationTable)
        .where(whereClause);

      // Get paginated notifications
      const rows = await db
        .select()
        .from(notificationTable)
        .where(whereClause)
        .orderBy(desc(notificationTable.createdAt))
        .limit(limit)
        .offset(offset);

      const notifications = rows.map((row) => this.mapToNotification(row));

      const totalPages = Math.ceil(totalCount / limit);

      return {
        notifications,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      appLogger.error({ error, userId, query }, "Failed to get notifications");
      throw error;
    }
  }

  /**
   * Get unread notification count for a user (with Redis caching)
   * @param userId - User ID
   * @returns Unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const cacheKey = `${UNREAD_COUNT_CACHE_PREFIX}${userId}`;

      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        return Number.parseInt(cached, 10);
      }

      // Query database
      const whereClause =
        and(eq(notificationTable.userId, userId), eq(notificationTable.read, false)) ??
        eq(notificationTable.userId, userId);
      const [{ value: unreadCount }] = await db
        .select({ value: count() })
        .from(notificationTable)
        .where(whereClause);

      // Cache the result with TTL
      await redis.setex(
        cacheKey,
        NOTIFICATION_CONFIG.unreadCountCacheTTL,
        unreadCount.toString(),
      );

      return unreadCount;
    } catch (error) {
      appLogger.error({ error, userId }, "Failed to get unread count");
      throw error;
    }
  }

  /**
   * Get notification counts by status and type for filter UI
   * @param userId - User ID
   * @returns Counts by status and type
   */
  async getNotificationCounts(userId: string): Promise<{
    byStatus: {
      all: number;
      read: number;
      unread: number;
    };
    byType: Record<NotificationType, number>;
  }> {
    try {
      // Get all notifications for this user
      const allNotifications = await db
        .select({ read: notificationTable.read, type: notificationTable.type })
        .from(notificationTable)
        .where(eq(notificationTable.userId, userId));

      // Calculate counts
      const byStatus = {
        all: allNotifications.length,
        read: allNotifications.filter((n) => n.read).length,
        unread: allNotifications.filter((n) => !n.read).length,
      };

      // Calculate counts by type
      const byType: Record<string, number> = {};
      for (const notification of allNotifications) {
        byType[notification.type] = (byType[notification.type] || 0) + 1;
      }

      return {
        byStatus,
        byType: byType as Record<NotificationType, number>,
      };
    } catch (error) {
      appLogger.error({ error, userId }, "Failed to get notification counts");
      throw error;
    }
  }

  /**
   * Mark a notification as read or unread
   * @param notificationId - Notification ID
   * @param read - Read status
   * @returns Updated notification or null if not found
   */
  async markNotificationRead(
    notificationId: string,
    read: boolean,
  ): Promise<Notification | null> {
    try {
      const [updated] = await db
        .update(notificationTable)
        .set({ read, updatedAt: new Date() })
        .where(eq(notificationTable.id, notificationId))
        .returning();

      if (!updated) {
        return null;
      }

      const notification = this.mapToNotification(updated);

      // Invalidate unread count cache
      await this.invalidateUnreadCountCache(notification.userId);

      appLogger.info({ notificationId, read }, "Notification read status updated");

      return notification;
    } catch (error) {
      appLogger.error(
        { error, notificationId, read },
        "Failed to mark notification read",
      );
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param userId - User ID
   * @returns Count of updated notifications
   */
  async markAllRead(userId: string): Promise<number> {
    try {
      const whereClause =
        and(eq(notificationTable.userId, userId), eq(notificationTable.read, false)) ??
        eq(notificationTable.userId, userId);
      const result = await db
        .update(notificationTable)
        .set({ read: true, updatedAt: new Date() })
        .where(whereClause)
        .returning({ id: notificationTable.id });

      const updatedCount = result.length;

      // Invalidate unread count cache
      await this.invalidateUnreadCountCache(userId);

      appLogger.info({ userId, updatedCount }, "Marked all notifications as read");

      return updatedCount;
    } catch (error) {
      appLogger.error({ error, userId }, "Failed to mark all notifications as read");
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param notificationId - Notification ID
   * @returns Deleted notification or null if not found
   */
  async deleteNotification(notificationId: string): Promise<Notification | null> {
    try {
      const [deleted] = await db
        .delete(notificationTable)
        .where(eq(notificationTable.id, notificationId))
        .returning();

      if (!deleted) {
        return null;
      }

      const notification = this.mapToNotification(deleted);

      // Invalidate unread count cache
      await this.invalidateUnreadCountCache(notification.userId);

      appLogger.info({ notificationId }, "Notification deleted");

      return notification;
    } catch (error) {
      appLogger.error({ error, notificationId }, "Failed to delete notification");
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   * @param userId - User ID
   * @returns Count of deleted notifications
   */
  async deleteAllNotifications(userId: string): Promise<number> {
    try {
      const result = await db
        .delete(notificationTable)
        .where(eq(notificationTable.userId, userId))
        .returning({ id: notificationTable.id });

      const deletedCount = result.length;

      // Invalidate unread count cache
      await this.invalidateUnreadCountCache(userId);

      appLogger.info({ userId, deletedCount }, "Deleted all notifications for user");

      return deletedCount;
    } catch (error) {
      appLogger.error({ error, userId }, "Failed to delete all notifications");
      throw error;
    }
  }

  /**
   * Get a single notification by ID
   * @param notificationId - Notification ID
   * @returns Notification or null if not found
   */
  async getNotificationById(notificationId: string): Promise<Notification | null> {
    try {
      const [row] = await db
        .select()
        .from(notificationTable)
        .where(eq(notificationTable.id, notificationId))
        .limit(1);

      if (!row) {
        return null;
      }

      return this.mapToNotification(row);
    } catch (error) {
      appLogger.error({ error, notificationId }, "Failed to get notification by ID");
      throw error;
    }
  }

  /**
   * Get or create notification preferences for a user
   * @param userId - User ID
   * @returns Notification preferences
   */
  async getOrCreatePreferences(userId: string) {
    try {
      // Try to get existing preferences
      const [existing] = await db
        .select()
        .from(notificationPreferencesTable)
        .where(eq(notificationPreferencesTable.userId, userId))
        .limit(1);

      if (existing) {
        return {
          id: existing.id,
          userId: existing.userId,
          emailEnabled: existing.emailEnabled,
          pushEnabled: existing.pushEnabled,
          emailTypes: JSON.parse(existing.emailTypes) as NotificationType[],
          pushTypes: JSON.parse(existing.pushTypes) as NotificationType[],
          createdAt: existing.createdAt.toISOString(),
          updatedAt: existing.updatedAt.toISOString(),
        };
      }

      // Create default preferences
      const now = new Date();
      const [created] = await db
        .insert(notificationPreferencesTable)
        .values({
          id: uuidv4(),
          userId,
          emailEnabled: true,
          pushEnabled: false,
          emailTypes: JSON.stringify([
            "friend_request",
            "mention",
            "announcement",
            "warning",
          ]),
          pushTypes: JSON.stringify(["message", "friend_request", "mention"]),
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        id: created.id,
        userId: created.userId,
        emailEnabled: created.emailEnabled,
        pushEnabled: created.pushEnabled,
        emailTypes: JSON.parse(created.emailTypes) as NotificationType[],
        pushTypes: JSON.parse(created.pushTypes) as NotificationType[],
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch (error) {
      appLogger.error(
        { error, userId },
        "Failed to get or create notification preferences",
      );
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: {
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      emailTypes?: NotificationType[];
      pushTypes?: NotificationType[];
    },
  ) {
    try {
      // Ensure preferences exist
      await this.getOrCreatePreferences(userId);

      // Build update object
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (updates.emailEnabled !== undefined) {
        updateData.emailEnabled = updates.emailEnabled;
      }
      if (updates.pushEnabled !== undefined) {
        updateData.pushEnabled = updates.pushEnabled;
      }
      if (updates.emailTypes !== undefined) {
        updateData.emailTypes = JSON.stringify(updates.emailTypes);
      }
      if (updates.pushTypes !== undefined) {
        updateData.pushTypes = JSON.stringify(updates.pushTypes);
      }

      const [updated] = await db
        .update(notificationPreferencesTable)
        .set(updateData)
        .where(eq(notificationPreferencesTable.userId, userId))
        .returning();

      appLogger.info({ userId, updates }, "Notification preferences updated");

      return {
        id: updated.id,
        userId: updated.userId,
        emailEnabled: updated.emailEnabled,
        pushEnabled: updated.pushEnabled,
        emailTypes: JSON.parse(updated.emailTypes) as NotificationType[],
        pushTypes: JSON.parse(updated.pushTypes) as NotificationType[],
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch (error) {
      appLogger.error(
        { error, userId, updates },
        "Failed to update notification preferences",
      );
      throw error;
    }
  }

  /**
   * Invalidate unread count cache for a user
   * @param userId - User ID
   */
  async invalidateUnreadCountCache(userId: string): Promise<void> {
    try {
      const cacheKey = `${UNREAD_COUNT_CACHE_PREFIX}${userId}`;
      await redis.del(cacheKey);
    } catch (error) {
      appLogger.error({ error, userId }, "Failed to invalidate unread count cache");
      // Don't throw - cache invalidation failure shouldn't break the operation
    }
  }

  /**
   * Map database row to Notification type
   */
  private mapToNotification(row: typeof notificationTable.$inferSelect): Notification {
    const metadata = this.parseNotificationMetadata(row.metadata, row.id);

    return {
      id: row.id,
      userId: row.userId,
      type: row.type as NotificationType,
      title: row.title,
      content: row.content,
      metadata,
      read: row.read,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private parseNotificationMetadata(
    metadataJson: string | null | undefined,
    notificationId: string,
  ): NotificationMetadata {
    if (!metadataJson) {
      return {};
    }

    try {
      const deserialized = JSON.parse(metadataJson, (key, value) => {
        if (NotificationService.METADATA_PROTO_BLACKLIST.has(key)) {
          return undefined;
        }
        return value;
      });

      const result = notificationMetadataSchema.safeParse(deserialized ?? {});

      if (!result.success) {
        appLogger.warn(
          { notificationId, issues: result.error.issues },
          "Notification metadata failed schema validation",
        );
        return {};
      }

      return this.deepFreezeMetadata(result.data);
    } catch (error) {
      appLogger.error({ error, notificationId }, "Failed to parse notification metadata");
      return {};
    }
  }

  private deepFreezeMetadata<T>(value: T): T {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }

    Object.freeze(value);

    const entries = Array.isArray(value)
      ? value
      : Object.values(value as Record<string, unknown>);

    for (const entry of entries) {
      this.deepFreezeMetadata(entry);
    }

    return value;
  }

  /**
   * Deliver notification using registered delivery strategies
   * Tries strategies in priority order until one succeeds
   * @param notification - The notification to deliver
   * @param options - Delivery options
   */
  private async deliverNotification(
    notification: Notification,
    options?: NotificationDeliveryOptions,
  ): Promise<void> {
    try {
      // Get strategies to use (from options or use all registered strategies in priority order)
      const strategiesToUse = options?.strategies
        ? this.deliveryStrategies.filter((s) =>
            options.strategies?.includes(s.name as never),
          )
        : this.sortStrategiesByPriority(this.deliveryStrategies);

      // Try each strategy in order
      for (const strategy of strategiesToUse) {
        try {
          const canDeliver = await strategy.canDeliver(notification.userId);
          if (canDeliver) {
            await strategy.deliver(notification);
            appLogger.info(
              {
                notificationId: notification.id,
                userId: notification.userId,
                strategy: strategy.name,
              },
              "Notification delivered via strategy",
            );
            return; // Stop after first successful delivery
          }
        } catch (error) {
          appLogger.error(
            { error, notificationId: notification.id, strategy: strategy.name },
            "Delivery strategy failed",
          );
          // Continue to next strategy on error
        }
      }

      appLogger.warn(
        { notificationId: notification.id, userId: notification.userId },
        "No delivery strategy succeeded for notification",
      );
    } catch (error) {
      appLogger.error(
        { error, notificationId: notification.id },
        "Failed to deliver notification",
      );
      // Don't throw - delivery failure shouldn't break notification creation
    }
  }

  /**
   * Sort delivery strategies by configured priority order
   */
  private sortStrategiesByPriority(
    strategies: NotificationDeliveryStrategy[],
  ): NotificationDeliveryStrategy[] {
    return [...strategies].sort((a, b) => {
      const aIndex = DELIVERY_STRATEGY_PRIORITY.indexOf(a.name as never);
      const bIndex = DELIVERY_STRATEGY_PRIORITY.indexOf(b.name as never);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
