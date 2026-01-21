import type { Redis } from "ioredis";
import type { Notification } from "shared/interfaces/notification";
import { appLogger } from "../utils/logger";
import { INSTANCE_ID } from "./instance-id";
import type { NotificationSSEManager } from "./notification-sse-manager";
import { getRedisPubSubPublisher, getRedisPubSubSubscriber } from "./redis";

/**
 * Pub/sub channels for cross-instance communication
 */
const CHANNELS = {
  NOTIFICATIONS: "notification:pubsub:global:notifications",
} as const;

/**
 * Message types for pub/sub communication
 */
type PubSubMessageType =
  | "new_notification"
  | "notification_updated"
  | "notification_deleted"
  | "notifications_cleared"
  | "unread_count_changed";

/**
 * Base pub/sub message structure
 */
interface PubSubMessage {
  type: PubSubMessageType;
  instanceId: string;
  timestamp: number;
  data: unknown;
}

/**
 * Manages Redis pub/sub for cross-instance notification delivery
 * Allows multiple API instances to broadcast notifications to all connected clients
 */
export class NotificationPubSubManager {
  private publisher: Redis;
  private subscriber: Redis;
  private notificationManager: NotificationSSEManager;
  private isStarted = false;
  private isDegraded = false;
  private startTime = 0;

  // Metrics tracking
  private metrics = {
    messagesPublished: 0,
    messagesReceived: 0,
    publishFailures: 0,
    latencies: [] as number[],
    maxLatencyMs: 0,
  };

  // Message deduplication
  private recentMessageIds = new Set<string>();

  constructor(notificationManager: NotificationSSEManager) {
    this.notificationManager = notificationManager;
    this.publisher = getRedisPubSubPublisher();
    this.subscriber = getRedisPubSubSubscriber();
  }

  /**
   * Start the pub/sub manager and subscribe to channels
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      appLogger.warn("NotificationPubSubManager already started");
      return;
    }

    this.startTime = Date.now();

    try {
      // Set up message handlers
      this.subscriber.on("message", (channel, message) => {
        this.handleMessage(channel, message);
      });

      // Set up error handlers
      this.subscriber.on("error", (error) => {
        appLogger.error({ error }, "Redis PubSub subscriber error");
      });

      this.publisher.on("error", (error) => {
        appLogger.error({ error }, "Redis PubSub publisher error");
      });

      // Handle disconnection
      this.subscriber.on("close", () => {
        this.handleRedisDisconnect();
      });

      // Handle reconnection
      this.subscriber.on("ready", () => {
        if (this.isDegraded) {
          this.handleRedisReconnect();
        }
      });

      // Subscribe to channels
      await this.subscriber.subscribe(CHANNELS.NOTIFICATIONS);

      this.isStarted = true;
      appLogger.info(
        { instanceId: INSTANCE_ID },
        "NotificationPubSubManager started and subscribed to channels",
      );
    } catch (error) {
      appLogger.error({ error }, "Failed to start NotificationPubSubManager");
      throw error;
    }
  }

  /**
   * Stop the pub/sub manager and unsubscribe from channels
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    try {
      await this.subscriber.unsubscribe(CHANNELS.NOTIFICATIONS);
      this.isStarted = false;
      appLogger.info("NotificationPubSubManager stopped");
    } catch (error) {
      appLogger.error({ error }, "Error stopping NotificationPubSubManager");
    }
  }

  /**
   * Publish a new notification to all instances
   */
  async publishNewNotification(notification: Notification): Promise<void> {
    const pubsubMessage: PubSubMessage = {
      type: "new_notification",
      instanceId: INSTANCE_ID,
      timestamp: Date.now(),
      data: notification,
    };

    await this.publish(CHANNELS.NOTIFICATIONS, pubsubMessage);
  }

  /**
   * Publish a notification update to all instances
   */
  async publishNotificationUpdate(notification: Notification): Promise<void> {
    const pubsubMessage: PubSubMessage = {
      type: "notification_updated",
      instanceId: INSTANCE_ID,
      timestamp: Date.now(),
      data: notification,
    };

    await this.publish(CHANNELS.NOTIFICATIONS, pubsubMessage);
  }

  /**
   * Publish a notification deletion to all instances
   */
  async publishNotificationDeletion(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    const pubsubMessage: PubSubMessage = {
      type: "notification_deleted",
      instanceId: INSTANCE_ID,
      timestamp: Date.now(),
      data: { notificationId, userId },
    };

    await this.publish(CHANNELS.NOTIFICATIONS, pubsubMessage);
  }

  /**
   * Publish an unread count change to all instances
   */
  async publishUnreadCountChange(userId: string, unreadCount: number): Promise<void> {
    const pubsubMessage: PubSubMessage = {
      type: "unread_count_changed",
      instanceId: INSTANCE_ID,
      timestamp: Date.now(),
      data: { userId, unreadCount },
    };

    await this.publish(CHANNELS.NOTIFICATIONS, pubsubMessage);
  }

  /**
   * Publish notifications cleared to all instances
   */
  async publishNotificationsCleared(userId: string, deletedCount: number): Promise<void> {
    const pubsubMessage: PubSubMessage = {
      type: "notifications_cleared",
      instanceId: INSTANCE_ID,
      timestamp: Date.now(),
      data: { userId, deletedCount },
    };

    await this.publish(CHANNELS.NOTIFICATIONS, pubsubMessage);
  }

  /**
   * Internal publish method
   */
  private async publish(channel: string, message: PubSubMessage): Promise<void> {
    try {
      const messageStr = JSON.stringify(message);
      await this.publisher.publish(channel, messageStr);
      this.metrics.messagesPublished++;
    } catch (error) {
      this.metrics.publishFailures++;
      appLogger.error(
        { error, channel, messageType: message.type },
        "Failed to publish message",
      );
      // Don't throw - allow local operation to continue even if pub/sub fails
    }
  }

  /**
   * Handle incoming pub/sub messages
   */
  private handleMessage(channel: string, message: string): void {
    try {
      const parsed = JSON.parse(message) as PubSubMessage;

      // Validate message structure
      if (!parsed.type || !parsed.instanceId || !parsed.data) {
        appLogger.warn({ message }, "Invalid pub/sub message structure");
        return;
      }

      // Validate instanceId (prevent injection)
      if (!/^[a-z0-9-]+$/i.test(parsed.instanceId)) {
        appLogger.error(
          { instanceId: parsed.instanceId },
          "Suspicious instanceId in pub/sub message",
        );
        return;
      }

      // Skip messages from our own instance to avoid echo
      if (parsed.instanceId === INSTANCE_ID) {
        return;
      }

      // Track received message
      this.metrics.messagesReceived++;

      // Calculate latency for monitoring
      const latency = Date.now() - parsed.timestamp;

      // Track latency metrics (keep last 100 samples for average)
      this.metrics.latencies.push(latency);
      if (this.metrics.latencies.length > 100) {
        this.metrics.latencies.shift();
      }
      if (latency > this.metrics.maxLatencyMs) {
        this.metrics.maxLatencyMs = latency;
      }

      appLogger.debug(
        {
          channel,
          type: parsed.type,
          sourceInstance: parsed.instanceId,
          latencyMs: latency,
        },
        "Received pub/sub message",
      );

      // Route to appropriate handler
      this.handleNotificationMessage(parsed);
    } catch (error) {
      appLogger.error({ error, channel, message }, "Failed to handle pub/sub message");
    }
  }

  /**
   * Check if message was already processed (deduplication)
   * Returns true if this is a duplicate message
   */
  private isDuplicateMessage(messageId: string): boolean {
    if (this.recentMessageIds.has(messageId)) {
      return true;
    }

    // Track this message ID
    this.recentMessageIds.add(messageId);

    // Auto-cleanup after 5 seconds
    setTimeout(() => {
      this.recentMessageIds.delete(messageId);
    }, 5000);

    return false;
  }

  /**
   * Handle notification messages (new, update, delete, unread count)
   */
  private handleNotificationMessage(message: PubSubMessage): void {
    switch (message.type) {
      case "new_notification": {
        const notification = message.data as Notification;

        // Deduplicate based on notification ID
        if (this.isDuplicateMessage(notification.id)) {
          appLogger.debug(
            { notificationId: notification.id },
            "Skipping duplicate notification",
          );
          return;
        }

        this.notificationManager.broadcastNewNotificationLocal(notification);
        break;
      }

      case "notification_updated": {
        const notification = message.data as Notification;

        // Deduplicate update events
        const dedupKey = `upd:${notification.id}`;
        if (this.isDuplicateMessage(dedupKey)) {
          appLogger.debug(
            { notificationId: notification.id },
            "Skipping duplicate update",
          );
          return;
        }

        this.notificationManager.broadcastNotificationUpdateLocal(notification);
        break;
      }

      case "notification_deleted": {
        const { notificationId, userId } = message.data as {
          notificationId: string;
          userId: string;
        };

        // Deduplicate deletion events
        const dedupKey = `del:${notificationId}`;
        if (this.isDuplicateMessage(dedupKey)) {
          appLogger.debug({ notificationId }, "Skipping duplicate deletion");
          return;
        }

        this.notificationManager.broadcastNotificationDeletionLocal(
          notificationId,
          userId,
        );
        break;
      }

      case "unread_count_changed": {
        const { userId, unreadCount } = message.data as {
          userId: string;
          unreadCount: number;
        };

        // Deduplicate unread count changes (use timestamp-based key)
        const dedupKey = `unread:${userId}:${message.timestamp}`;
        if (this.isDuplicateMessage(dedupKey)) {
          appLogger.debug({ userId }, "Skipping duplicate unread count change");
          return;
        }

        this.notificationManager.broadcastUnreadCountChangeLocal(userId, unreadCount);
        break;
      }

      case "notifications_cleared": {
        const { userId, deletedCount } = message.data as {
          userId: string;
          deletedCount: number;
        };

        // Deduplicate clear events (use timestamp-based key)
        const dedupKey = `clear:${userId}:${message.timestamp}`;
        if (this.isDuplicateMessage(dedupKey)) {
          appLogger.debug({ userId }, "Skipping duplicate notifications cleared");
          return;
        }

        this.notificationManager.broadcastNotificationsClearedLocal(userId, deletedCount);
        break;
      }

      default:
        appLogger.warn({ type: message.type }, "Unknown notification message type");
    }
  }

  /**
   * Handle Redis disconnection - enter degraded mode
   */
  private handleRedisDisconnect(): void {
    appLogger.warn("Redis disconnected, entering degraded mode - local broadcasts only");
    this.isDegraded = true;
  }

  /**
   * Handle Redis reconnection - resume normal operation
   */
  private async handleRedisReconnect(): Promise<void> {
    appLogger.info("Redis reconnected, resuming distributed mode");
    try {
      // Re-subscribe to channels
      await this.subscriber.subscribe(CHANNELS.NOTIFICATIONS);
      this.isDegraded = false;
    } catch (error) {
      appLogger.error({ error }, "Failed to re-subscribe after reconnect");
    }
  }

  /**
   * Check if the pub/sub manager is in degraded mode
   */
  isDegradedMode(): boolean {
    return this.isDegraded;
  }

  /**
   * Get pub/sub metrics for monitoring
   */
  getMetrics() {
    const averageLatencyMs =
      this.metrics.latencies.length > 0
        ? this.metrics.latencies.reduce((a, b) => a + b, 0) /
          this.metrics.latencies.length
        : 0;

    const uptime = this.startTime > 0 ? Date.now() - this.startTime : 0;

    return {
      messagesPublished: this.metrics.messagesPublished,
      messagesReceived: this.metrics.messagesReceived,
      publishFailures: this.metrics.publishFailures,
      averageLatencyMs: Math.round(averageLatencyMs * 100) / 100,
      maxLatencyMs: this.metrics.maxLatencyMs,
      isDegraded: this.isDegraded,
      uptime,
    };
  }
}
