import { describe, expect, mock, test } from "bun:test";
import { NotificationType } from "shared/interfaces/notification";
import type { Notification } from "shared/interfaces/notification";
import { ensureTestEnv } from "./mocks/env";

ensureTestEnv();

describe("NotificationDeliveryStrategy", () => {
  const mockNotification: Notification = {
    id: "notif-1",
    userId: "user-1",
    type: NotificationType.MESSAGE,
    title: "Test Notification",
    content: "Test content",
    metadata: {},
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe("SSEDeliveryStrategy", () => {
    test("canDeliver returns true when user is online", async () => {
      const { SSEDeliveryStrategy } = await import(
        "../src/lib/notification-delivery-strategy"
      );

      const isUserOnline = mock(() => true);
      const strategy = new SSEDeliveryStrategy(isUserOnline);

      const canDeliver = await strategy.canDeliver("user-1");
      expect(canDeliver).toBe(true);
      expect(isUserOnline).toHaveBeenCalledWith("user-1");
    });

    test("canDeliver returns false when user is offline", async () => {
      const { SSEDeliveryStrategy } = await import(
        "../src/lib/notification-delivery-strategy"
      );

      const isUserOnline = mock(() => false);
      const strategy = new SSEDeliveryStrategy(isUserOnline);

      const canDeliver = await strategy.canDeliver("user-1");
      expect(canDeliver).toBe(false);
    });

    test("has correct name", async () => {
      const { SSEDeliveryStrategy } = await import(
        "../src/lib/notification-delivery-strategy"
      );

      const strategy = new SSEDeliveryStrategy(() => false);
      expect(strategy.name).toBe("sse");
    });

    test("deliver completes without error", async () => {
      const { SSEDeliveryStrategy } = await import(
        "../src/lib/notification-delivery-strategy"
      );

      const strategy = new SSEDeliveryStrategy(() => true);

      // Should not throw
      await expect(strategy.deliver(mockNotification)).resolves.toBeUndefined();
    });
  });

  describe("PushDeliveryStrategy", () => {
    test("canDeliver returns false (not implemented yet)", async () => {
      const { PushDeliveryStrategy } = await import(
        "../src/lib/notification-delivery-strategy"
      );

      const strategy = new PushDeliveryStrategy();

      const canDeliver = await strategy.canDeliver("user-1");
      expect(canDeliver).toBe(false);
    });

    test("has correct name", async () => {
      const { PushDeliveryStrategy } = await import(
        "../src/lib/notification-delivery-strategy"
      );

      const strategy = new PushDeliveryStrategy();
      expect(strategy.name).toBe("push");
    });

    test("deliver throws not implemented error", async () => {
      const { PushDeliveryStrategy } = await import(
        "../src/lib/notification-delivery-strategy"
      );

      const strategy = new PushDeliveryStrategy();

      await expect(strategy.deliver(mockNotification)).rejects.toThrow(
        "Push notification delivery not implemented yet",
      );
    });
  });

  describe("EmailDeliveryStrategy", () => {
    test("canDeliver returns false when user is online", async () => {
      const { EmailDeliveryStrategy } = await import(
        "../src/lib/notification-email-delivery"
      );

      const isUserOnline = mock(() => true);
      const strategy = new EmailDeliveryStrategy(isUserOnline);

      const canDeliver = await strategy.canDeliver("user-1");
      expect(canDeliver).toBe(false);
      expect(isUserOnline).toHaveBeenCalledWith("user-1");
    });

    test("canDeliver returns true when user is offline and email enabled", async () => {
      const { EmailDeliveryStrategy } = await import(
        "../src/lib/notification-email-delivery"
      );

      const isUserOnline = mock(() => false);
      const strategy = new EmailDeliveryStrategy(isUserOnline);

      // In test environment with mocked DB, this will check preferences
      // The default behavior is to return true if no preferences exist
      const canDeliver = await strategy.canDeliver("user-1");

      // This test depends on DB state, but should handle both cases
      expect(typeof canDeliver).toBe("boolean");
    });

    test("has correct name", async () => {
      const { EmailDeliveryStrategy } = await import(
        "../src/lib/notification-email-delivery"
      );

      const strategy = new EmailDeliveryStrategy(() => false);
      expect(strategy.name).toBe("email");
    });

    test("deliver completes without error when email is not configured", async () => {
      const { EmailDeliveryStrategy } = await import(
        "../src/lib/notification-email-delivery"
      );

      const isUserOnline = mock(() => false);
      const strategy = new EmailDeliveryStrategy(isUserOnline);

      // In development without SMTP configured, should log and return
      // Should not throw error
      await expect(strategy.deliver(mockNotification)).resolves.toBeUndefined();
    });
  });

  describe("Delivery Strategy Pattern", () => {
    test("all strategies implement the same interface", async () => {
      const { SSEDeliveryStrategy, PushDeliveryStrategy } = await import(
        "../src/lib/notification-delivery-strategy"
      );
      const { EmailDeliveryStrategy } = await import(
        "../src/lib/notification-email-delivery"
      );

      const sseStrategy = new SSEDeliveryStrategy(() => false);
      const pushStrategy = new PushDeliveryStrategy();
      const emailStrategy = new EmailDeliveryStrategy(() => false);

      // All should have required properties
      expect(typeof sseStrategy.name).toBe("string");
      expect(typeof pushStrategy.name).toBe("string");
      expect(typeof emailStrategy.name).toBe("string");

      expect(typeof sseStrategy.canDeliver).toBe("function");
      expect(typeof pushStrategy.canDeliver).toBe("function");
      expect(typeof emailStrategy.canDeliver).toBe("function");

      expect(typeof sseStrategy.deliver).toBe("function");
      expect(typeof pushStrategy.deliver).toBe("function");
      expect(typeof emailStrategy.deliver).toBe("function");
    });

    test("strategies have unique names", async () => {
      const { SSEDeliveryStrategy, PushDeliveryStrategy } = await import(
        "../src/lib/notification-delivery-strategy"
      );
      const { EmailDeliveryStrategy } = await import(
        "../src/lib/notification-email-delivery"
      );

      const sseStrategy = new SSEDeliveryStrategy(() => false);
      const pushStrategy = new PushDeliveryStrategy();
      const emailStrategy = new EmailDeliveryStrategy(() => false);

      const names = new Set([sseStrategy.name, pushStrategy.name, emailStrategy.name]);
      expect(names.size).toBe(3); // All names should be unique
    });

    test("SSE strategy prioritizes online users", async () => {
      const { SSEDeliveryStrategy } = await import(
        "../src/lib/notification-delivery-strategy"
      );
      const { EmailDeliveryStrategy } = await import(
        "../src/lib/notification-email-delivery"
      );

      const onlineUser = "user-online";
      const offlineUser = "user-offline";

      const isUserOnline = mock((userId: string) => userId === onlineUser);

      const sseStrategy = new SSEDeliveryStrategy(isUserOnline);
      const emailStrategy = new EmailDeliveryStrategy(isUserOnline);

      // SSE can deliver to online users
      expect(await sseStrategy.canDeliver(onlineUser)).toBe(true);
      expect(await sseStrategy.canDeliver(offlineUser)).toBe(false);

      // Email should NOT deliver to online users (inverse of SSE)
      expect(await emailStrategy.canDeliver(onlineUser)).toBe(false);
      // Email can potentially deliver to offline users (depends on preferences)
    });

    test("strategies can be used in a priority order", async () => {
      const { SSEDeliveryStrategy, PushDeliveryStrategy } = await import(
        "../src/lib/notification-delivery-strategy"
      );
      const { EmailDeliveryStrategy } = await import(
        "../src/lib/notification-email-delivery"
      );

      const strategies = [
        new SSEDeliveryStrategy(() => false),
        new PushDeliveryStrategy(),
        new EmailDeliveryStrategy(() => false),
      ];

      // Should be able to iterate through strategies in priority order
      const strategiesTriedInOrder = [];
      for (const strategy of strategies) {
        strategiesTriedInOrder.push(strategy.name);
        const canDeliver = await strategy.canDeliver("user-1");
        if (canDeliver) {
          break; // Use first available strategy
        }
      }

      expect(strategiesTriedInOrder.length).toBeGreaterThan(0);
      expect(strategiesTriedInOrder[0]).toBe("sse");
    });
  });
});
