import { afterEach, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import "./mocks/redis";
import "./mocks/db";
import { eq } from "drizzle-orm";
import { NotificationActionType, NotificationType } from "shared/interfaces/notification";
import { clearDbStores } from "./mocks/db";
import { ensureTestEnv } from "./mocks/env";
import { clearRedisStores } from "./mocks/redis";

ensureTestEnv();

// Mock the notification SSE manager to prevent actual SSE broadcasting during tests
const mockNotificationSSEManager = {
  broadcastNewNotification: mock(() => Promise.resolve()),
  broadcastNotificationUpdate: mock(() => Promise.resolve()),
  broadcastNotificationDeletion: mock(() => Promise.resolve()),
  broadcastUnreadCountChange: mock(() => Promise.resolve()),
  isUserOnline: mock(() => false),
};

const notificationSSEManagerPath = import.meta.resolve(
  "../src/lib/notification-sse-manager.ts",
);
mock.module(notificationSSEManagerPath, () => ({
  notificationSSEManager: mockNotificationSSEManager,
}));

const TEST_USER_IDS = ["user-1", "user-2", "user-test", "user-new"];

describe("NotificationService", () => {
  beforeAll(async () => {
    // Create test users in the database
    const { db } = await import("../src/db/client");
    const { user } = await import("../src/db/schema");

    for (const userId of TEST_USER_IDS) {
      try {
        await db
          .insert(user)
          .values({
            id: userId,
            name: `Test User ${userId}`,
            email: `${userId}@test.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoNothing();
      } catch (error) {
        // Ignore if user already exists
      }
    }
  });

  beforeEach(() => {
    // Ensure clean state before each test
    clearRedisStores();
    clearDbStores();
  });

  afterEach(async () => {
    // Clean up notifications and preferences after each test
    const { db } = await import("../src/db/client");
    const { notification, notificationPreferences } = await import("../src/db/schema");

    for (const userId of TEST_USER_IDS) {
      await db.delete(notification).where(eq(notification.userId, userId));
      await db
        .delete(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
    }

    clearRedisStores();
    clearDbStores();
  });

  describe("createNotification", () => {
    test("creates notification and invalidates cache", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const notification = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Test Notification",
        content: "This is a test notification",
        metadata: {
          data: { source: "test" },
        },
      });

      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.userId).toBe("user-1");
      expect(notification.type).toBe(NotificationType.MESSAGE);
      expect(notification.title).toBe("Test Notification");
      expect(notification.content).toBe("This is a test notification");
      expect(notification.read).toBe(false);
      expect(notification.metadata).toEqual({ data: { source: "test" } });
      expect(notification.createdAt).toBeDefined();
      expect(notification.updatedAt).toBeDefined();
    });

    test("creates notification with empty metadata", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const notification = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.SYSTEM,
        title: "System Alert",
        content: "System maintenance scheduled",
      });

      expect(notification.metadata).toEqual({});
    });

    test("creates notification with actions in metadata", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const notification = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.FRIEND_REQUEST,
        title: "Friend Request",
        content: "John Doe sent you a friend request",
        metadata: {
          actions: [
            {
              actionId: "accept-friend-request",
              type: NotificationActionType.LINK,
              label: "Accept",
              url: "/friends/accept",
              openInNewTab: false,
            },
          ],
        },
      });

      expect(notification.metadata.actions).toBeDefined();
      expect(notification.metadata.actions?.length).toBe(1);
      expect(notification.metadata.actions?.[0].label).toBe("Accept");
      expect(notification.metadata.actions?.[0].type).toBe(NotificationActionType.LINK);
      expect(notification.metadata.actions?.[0].url).toBe("/friends/accept");
    });
  });

  describe("getNotifications", () => {
    test("returns paginated notifications", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      // Create multiple notifications
      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "First",
        content: "First notification",
      });
      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Second",
        content: "Second notification",
      });
      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Third",
        content: "Third notification",
      });

      const result = await notificationService.getNotifications("user-1", {
        page: 1,
        limit: 2,
        filter: "all",
      });

      expect(result.notifications.length).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.totalCount).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(false);
    });

    test("filters by read status", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const notif1 = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Unread",
        content: "Unread notification",
      });
      const notif2 = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "To be read",
        content: "Will be marked as read",
      });

      // Mark one as read
      await notificationService.markNotificationRead(notif2.id, true);

      const unreadResult = await notificationService.getNotifications("user-1", {
        page: 1,
        limit: 10,
        filter: "unread",
      });

      expect(unreadResult.notifications.length).toBe(1);
      expect(unreadResult.notifications[0].id).toBe(notif1.id);

      const readResult = await notificationService.getNotifications("user-1", {
        page: 1,
        limit: 10,
        filter: "read",
      });

      expect(readResult.notifications.length).toBe(1);
      expect(readResult.notifications[0].id).toBe(notif2.id);
    });

    test("searches notifications by title and content", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Important Update",
        content: "System upgrade scheduled",
      });
      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Daily Report",
        content: "Your daily summary",
      });

      const result = await notificationService.getNotifications("user-1", {
        page: 1,
        limit: 10,
        filter: "all",
        search: "important",
      });

      expect(result.notifications.length).toBe(1);
      expect(result.notifications[0].title).toBe("Important Update");
    });

    test("returns notifications ordered by creation time (newest first)", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const first = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "First",
        content: "First",
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const second = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Second",
        content: "Second",
      });

      const result = await notificationService.getNotifications("user-1", {
        page: 1,
        limit: 10,
        filter: "all",
      });

      expect(result.notifications[0].id).toBe(second.id);
      expect(result.notifications[1].id).toBe(first.id);
    });
  });

  describe("getUnreadCount", () => {
    test("returns correct unread count", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Unread 1",
        content: "First unread",
      });
      const notif2 = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "To be read",
        content: "Will be marked as read",
      });
      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Unread 2",
        content: "Second unread",
      });

      // Mark one as read
      await notificationService.markNotificationRead(notif2.id, true);

      const count = await notificationService.getUnreadCount("user-1");
      expect(count).toBe(2);
    });

    test("uses Redis cache on subsequent calls", async () => {
      const { notificationService } = await import("../src/lib/notification-service");
      const { redis } = await import("../src/lib/redis");

      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Test",
        content: "Test notification",
      });

      // First call should query database and cache
      const count1 = await notificationService.getUnreadCount("user-1");
      expect(count1).toBe(1);

      // Verify it's in Redis cache
      const cached = await redis.get("notification:unread:user-1");
      expect(cached).toBe("1");

      // Second call should use cache (even if we modify database)
      const count2 = await notificationService.getUnreadCount("user-1");
      expect(count2).toBe(1);
    });
  });

  describe("markNotificationRead", () => {
    test("marks notification as read and invalidates cache", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const notification = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Test",
        content: "Test notification",
      });

      expect(notification.read).toBe(false);

      const updated = await notificationService.markNotificationRead(
        notification.id,
        true,
      );
      expect(updated).toBeDefined();
      expect(updated?.read).toBe(true);
      expect(updated?.updatedAt).toBeDefined();

      // Verify unread count is updated
      const unreadCount = await notificationService.getUnreadCount("user-1");
      expect(unreadCount).toBe(0);
    });

    test("marks notification as unread", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const notification = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Test",
        content: "Test notification",
      });

      await notificationService.markNotificationRead(notification.id, true);
      const unread = await notificationService.markNotificationRead(
        notification.id,
        false,
      );

      expect(unread?.read).toBe(false);
    });

    test("returns null for non-existent notification", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const result = await notificationService.markNotificationRead(
        "non-existent-id",
        true,
      );
      expect(result).toBeNull();
    });
  });

  describe("markAllRead", () => {
    test("marks all user notifications as read", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "First",
        content: "First",
      });
      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Second",
        content: "Second",
      });
      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Third",
        content: "Third",
      });

      const updatedCount = await notificationService.markAllRead("user-1");
      expect(updatedCount).toBe(3);

      const unreadCount = await notificationService.getUnreadCount("user-1");
      expect(unreadCount).toBe(0);
    });

    test("returns 0 when no unread notifications", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const updatedCount = await notificationService.markAllRead("user-1");
      expect(updatedCount).toBe(0);
    });
  });

  describe("deleteNotification", () => {
    test("deletes notification and invalidates cache", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const notification = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Test",
        content: "Test notification",
      });

      const deleted = await notificationService.deleteNotification(notification.id);
      expect(deleted).toBeDefined();
      expect(deleted?.id).toBe(notification.id);

      // Verify it's deleted
      const retrieved = await notificationService.getNotificationById(notification.id);
      expect(retrieved).toBeNull();
    });

    test("returns null for non-existent notification", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const result = await notificationService.deleteNotification("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("deleteAllNotifications", () => {
    test("deletes all notifications for user", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "First",
        content: "First",
      });
      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Second",
        content: "Second",
      });
      await notificationService.createNotification({
        userId: "user-2",
        type: NotificationType.MESSAGE,
        title: "Other user",
        content: "Should not be deleted",
      });

      const deletedCount = await notificationService.deleteAllNotifications("user-1");
      expect(deletedCount).toBe(2);

      const result = await notificationService.getNotifications("user-1", {
        page: 1,
        limit: 10,
        filter: "all",
      });
      expect(result.notifications.length).toBe(0);

      // Verify user-2 notifications are not affected
      const user2Result = await notificationService.getNotifications("user-2", {
        page: 1,
        limit: 10,
        filter: "all",
      });
      expect(user2Result.notifications.length).toBe(1);
    });

    test("returns 0 when user has no notifications", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const deletedCount = await notificationService.deleteAllNotifications("user-1");
      expect(deletedCount).toBe(0);
    });
  });

  describe("getNotificationById", () => {
    test("returns notification by ID", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const created = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Test",
        content: "Test notification",
      });

      const retrieved = await notificationService.getNotificationById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe("Test");
    });

    test("returns null for non-existent ID", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const result = await notificationService.getNotificationById("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("getOrCreatePreferences", () => {
    test("creates default preferences for new user", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const prefs = await notificationService.getOrCreatePreferences("user-1");

      expect(prefs).toBeDefined();
      expect(prefs.userId).toBe("user-1");
      expect(prefs.emailEnabled).toBe(true);
      expect(prefs.pushEnabled).toBe(false);
      expect(Array.isArray(prefs.emailTypes)).toBe(true);
      expect(Array.isArray(prefs.pushTypes)).toBe(true);
    });

    test("returns existing preferences", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const prefs1 = await notificationService.getOrCreatePreferences("user-1");
      const prefs2 = await notificationService.getOrCreatePreferences("user-1");

      expect(prefs1.id).toBe(prefs2.id);
    });
  });

  describe("updatePreferences", () => {
    test("updates email enabled setting", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      await notificationService.getOrCreatePreferences("user-1");

      const updated = await notificationService.updatePreferences("user-1", {
        emailEnabled: false,
      });

      expect(updated.emailEnabled).toBe(false);
    });

    test("updates notification types", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      await notificationService.getOrCreatePreferences("user-1");

      const updated = await notificationService.updatePreferences("user-1", {
        emailTypes: [NotificationType.SYSTEM, NotificationType.WARNING],
        pushTypes: [NotificationType.MESSAGE],
      });

      expect(updated.emailTypes).toEqual([
        NotificationType.SYSTEM,
        NotificationType.WARNING,
      ]);
      expect(updated.pushTypes).toEqual([NotificationType.MESSAGE]);
    });

    test("creates preferences if they don't exist", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const updated = await notificationService.updatePreferences("user-new", {
        emailEnabled: false,
      });

      expect(updated.userId).toBe("user-new");
      expect(updated.emailEnabled).toBe(false);
    });
  });

  describe("mapToNotification", () => {
    test("correctly maps database row to Notification type", async () => {
      const { notificationService } = await import("../src/lib/notification-service");

      const notification = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Test",
        content: "Test notification",
        metadata: {
          data: { key: "value" },
          priority: "high",
        },
      });

      expect(notification.id).toBeDefined();
      expect(notification.userId).toBe("user-1");
      expect(notification.type).toBe(NotificationType.MESSAGE);
      expect(notification.title).toBe("Test");
      expect(notification.content).toBe("Test notification");
      expect(notification.metadata).toEqual({
        data: { key: "value" },
        priority: "high",
      });
      expect(notification.read).toBe(false);
      expect(typeof notification.createdAt).toBe("string");
      expect(typeof notification.updatedAt).toBe("string");
    });
  });
});
