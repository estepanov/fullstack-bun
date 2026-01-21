import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import "./mocks/redis";
import "./mocks/db";
import { Hono } from "hono";
import { NotificationType } from "shared/interfaces/notification";
import type { LoggerMiddlewareEnv } from "../src/middlewares/logger";
import { authMockState } from "./mocks/auth-state";
import { clearDbStores } from "./mocks/db";
import { ensureTestEnv } from "./mocks/env";
import { testLogger } from "./mocks/logger";
import { clearRedisStores } from "./mocks/redis";

ensureTestEnv();

const user = {
  id: "user-1",
  name: "Alex",
  username: "alex",
  displayUsername: "alex",
  email: "alex@example.com",
  emailVerified: true,
  role: "user",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const adminUser = {
  ...user,
  id: "admin-1",
  role: "admin",
};

const session = { id: "session-1" };

// Note: We use the real notification service with mocked DB/Redis underneath
// This avoids mock pollution that affects other test files

// Mock notification SSE manager
const mockNotificationSSEManager = {
  broadcastNewNotification: mock(() => {}),
  broadcastNotificationUpdate: mock(() => {}),
  broadcastNotificationDeletion: mock(() => {}),
  broadcastNotificationsCleared: mock(() => {}),
  broadcastUnreadCountChange: mock(() => {}),
  touchUser: mock(() => {}),
};

// Don't mock the notification service - use the real service with mocked DB/Redis
// to avoid test pollution across test files
// mock.module("../src/lib/notification-service", () => ({
//   notificationService: mockNotificationService,
// }));

mock.module("../src/lib/notification-sse-manager", () => ({
  notificationSSEManager: mockNotificationSSEManager,
}));

mock.module("../src/lib/auth", () => ({
  auth: {
    api: {
      getSession: () => Promise.resolve(authMockState.session),
    },
  },
}));

describe("notificationRouter", () => {
  beforeEach(() => {
    // Ensure clean state before each test
    clearRedisStores();
    clearDbStores();
  });

  afterEach(() => {
    authMockState.session = null;
    clearRedisStores();
    clearDbStores();
  });

  const buildApp = async () => {
    const { notificationRouter } = await import("../src/routers/notification-router");
    const app = new Hono<LoggerMiddlewareEnv>();
    app.use((c, next) => {
      c.set("logger", testLogger);
      c.set("requestId", "req-1");
      c.set("sessionId", "sess-1");
      return next();
    });
    app.route("/notification", notificationRouter);
    return app;
  };

  describe("GET /notification/list", () => {
    test("returns paginated notifications for authenticated user", async () => {
      authMockState.session = { user, session };

      const app = await buildApp();
      const res = await app.request("/notification/list?page=1&limit=10&filter=all");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.notifications).toBeDefined();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
    });

    test("returns 401 when not authenticated", async () => {
      authMockState.session = null;

      const app = await buildApp();
      const res = await app.request("/notification/list?page=1&limit=10&filter=all");

      expect(res.status).toBe(401);
    });

    test("validates query parameters", async () => {
      authMockState.session = { user, session };

      const app = await buildApp();
      // Test with invalid filter value
      const res = await app.request("/notification/list?page=1&limit=10&filter=invalid");

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });

  describe("GET /notification/unread-count", () => {
    test("returns unread count for authenticated user", async () => {
      authMockState.session = { user, session };

      // Create some unread notifications
      const { notificationService } = await import("../src/lib/notification-service");
      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Test 1",
        content: "Content 1",
      });
      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Test 2",
        content: "Content 2",
      });
      await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Test 3",
        content: "Content 3",
      });

      const app = await buildApp();
      const res = await app.request("/notification/unread-count");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.unreadCount).toBe(3);
    });

    test("returns 401 when not authenticated", async () => {
      authMockState.session = null;

      const app = await buildApp();
      const res = await app.request("/notification/unread-count");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /notification/create", () => {
    test("creates notification when admin", async () => {
      authMockState.session = { user: adminUser, session };

      const app = await buildApp();
      const res = await app.request("/notification/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-2",
          type: NotificationType.MESSAGE,
          title: "New Notification",
          content: "Test content",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.notification).toBeDefined();
      // Using real service now, so check the actual notification properties
      expect(data.notification.userId).toBe("user-2");
      expect(data.notification.title).toBe("New Notification");
    });

    test("returns 403 when not admin", async () => {
      authMockState.session = { user, session };

      const app = await buildApp();
      const res = await app.request("/notification/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-2",
          type: NotificationType.MESSAGE,
          title: "New Notification",
          content: "Test content",
        }),
      });

      expect(res.status).toBe(403);
    });

    test("validates request body", async () => {
      authMockState.session = { user: adminUser, session };

      const app = await buildApp();
      const res = await app.request("/notification/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Missing required fields
          userId: "user-2",
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /notification/:id/read", () => {
    test("marks notification as read", async () => {
      authMockState.session = { user, session };

      // Create a notification first
      const { notificationService } = await import("../src/lib/notification-service");
      const notification = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Test",
        content: "Test content",
      });

      const app = await buildApp();
      const res = await app.request(`/notification/${notification.id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.notification.read).toBe(true);
      expect(mockNotificationSSEManager.broadcastNotificationUpdate).toHaveBeenCalled();
      expect(mockNotificationSSEManager.broadcastUnreadCountChange).toHaveBeenCalled();
    });

    test("returns 404 for non-existent notification", async () => {
      authMockState.session = { user, session };

      const app = await buildApp();
      const res = await app.request("/notification/non-existent/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });

      expect(res.status).toBe(404);
    });

    test("validates request body", async () => {
      authMockState.session = { user, session };

      const app = await buildApp();
      const res = await app.request("/notification/existing-notif/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /notification/mark-all-read", () => {
    test("marks all notifications as read", async () => {
      authMockState.session = { user, session };

      // Create 5 unread notifications
      const { notificationService } = await import("../src/lib/notification-service");
      for (let i = 0; i < 5; i++) {
        await notificationService.createNotification({
          userId: "user-1",
          type: NotificationType.MESSAGE,
          title: `Test ${i}`,
          content: `Content ${i}`,
        });
      }

      const app = await buildApp();
      const res = await app.request("/notification/mark-all-read", {
        method: "PATCH",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.updatedCount).toBe(5);
      expect(mockNotificationSSEManager.broadcastUnreadCountChange).toHaveBeenCalledWith(
        "user-1",
        0,
      );
    });

    test("returns 401 when not authenticated", async () => {
      authMockState.session = null;

      const app = await buildApp();
      const res = await app.request("/notification/mark-all-read", {
        method: "PATCH",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /notification/:id", () => {
    test("deletes notification", async () => {
      authMockState.session = { user, session };

      // Create a notification first
      const { notificationService } = await import("../src/lib/notification-service");
      const notification = await notificationService.createNotification({
        userId: "user-1",
        type: NotificationType.MESSAGE,
        title: "Test",
        content: "Test content",
      });

      const app = await buildApp();
      const res = await app.request(`/notification/${notification.id}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.notificationId).toBe(notification.id);
      expect(mockNotificationSSEManager.broadcastNotificationDeletion).toHaveBeenCalled();
      expect(mockNotificationSSEManager.broadcastUnreadCountChange).toHaveBeenCalled();
    });

    test("returns 404 for non-existent notification", async () => {
      authMockState.session = { user, session };

      const app = await buildApp();
      const res = await app.request("/notification/non-existent", {
        method: "DELETE",
      });

      expect(res.status).toBe(404);
    });

    test("returns 401 when not authenticated", async () => {
      authMockState.session = null;

      const app = await buildApp();
      const res = await app.request("/notification/existing-notif", {
        method: "DELETE",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /notification/delete-all", () => {
    test("deletes all user notifications", async () => {
      authMockState.session = { user, session };

      // Create 10 notifications
      const { notificationService } = await import("../src/lib/notification-service");
      for (let i = 0; i < 10; i++) {
        await notificationService.createNotification({
          userId: "user-1",
          type: NotificationType.MESSAGE,
          title: `Test ${i}`,
          content: `Content ${i}`,
        });
      }

      const app = await buildApp();
      const res = await app.request("/notification/delete-all", {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.deletedCount).toBe(10);
      expect(
        mockNotificationSSEManager.broadcastNotificationsCleared,
      ).toHaveBeenCalledWith("user-1", 10);
      expect(mockNotificationSSEManager.broadcastUnreadCountChange).toHaveBeenCalledWith(
        "user-1",
        0,
      );
    });

    test("returns 401 when not authenticated", async () => {
      authMockState.session = null;

      const app = await buildApp();
      const res = await app.request("/notification/delete-all", {
        method: "DELETE",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /notification/preferences", () => {
    test("returns user notification preferences", async () => {
      authMockState.session = { user, session };

      const app = await buildApp();
      const res = await app.request("/notification/preferences");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.preferences).toBeDefined();
      expect(data.preferences.emailEnabled).toBe(true);
      expect(data.preferences.pushEnabled).toBe(false);
    });

    test("returns 401 when not authenticated", async () => {
      authMockState.session = null;

      const app = await buildApp();
      const res = await app.request("/notification/preferences");

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /notification/preferences", () => {
    test("updates notification preferences", async () => {
      authMockState.session = { user, session };

      const app = await buildApp();
      const res = await app.request("/notification/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailEnabled: false,
          pushEnabled: true,
          emailTypes: [],
          pushTypes: [NotificationType.MESSAGE, NotificationType.MENTION],
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.preferences.emailEnabled).toBe(false);
      expect(data.preferences.pushEnabled).toBe(true);
    });

    test("validates request body", async () => {
      authMockState.session = { user, session };

      const app = await buildApp();
      const res = await app.request("/notification/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailEnabled: "invalid", // Should be boolean
        }),
      });

      expect(res.status).toBe(400);
    });

    test("returns 401 when not authenticated", async () => {
      authMockState.session = null;

      const app = await buildApp();
      const res = await app.request("/notification/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailEnabled: false,
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /notification/heartbeat", () => {
    test("returns success with timestamp for authenticated user", async () => {
      authMockState.session = { user, session };

      const app = await buildApp();
      const res = await app.request("/notification/heartbeat", {
        method: "POST",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.timestamp).toBeTypeOf("number");
      expect(mockNotificationSSEManager.touchUser).toHaveBeenCalledWith("user-1");
    });

    test("returns 401 when not authenticated", async () => {
      authMockState.session = null;

      const app = await buildApp();
      const res = await app.request("/notification/heartbeat", {
        method: "POST",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /notification/stream", () => {
    test("requires authentication", async () => {
      authMockState.session = null;

      const app = await buildApp();
      const res = await app.request("/notification/stream");

      expect(res.status).toBe(401);
    });

    test("returns event stream with correct headers", async () => {
      authMockState.session = { user, session };

      const app = await buildApp();
      const res = await app.request("/notification/stream");

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/event-stream");
      expect(res.headers.get("cache-control")).toBe("no-cache");
      expect(res.headers.get("connection")).toBe("keep-alive");
    });
  });
});
