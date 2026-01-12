import type { Redis } from "ioredis";
import type { ChatMessage } from "shared/interfaces/chat";
import { appLogger } from "../utils/logger";
import type { ChatManager } from "./chat-manager";
import { INSTANCE_ID } from "./instance-id";
import { getRedisPubSubPublisher, getRedisPubSubSubscriber } from "./redis";

/**
 * Pub/sub channels for cross-instance communication
 */
const CHANNELS = {
  BROADCAST: "chat:pubsub:global:broadcast",
  PRESENCE: "chat:pubsub:global:presence",
  CONTROL: "chat:pubsub:global:control",
} as const;

/**
 * Message types for pub/sub communication
 */
type PubSubMessageType =
  | "new_message"
  | "message_deleted"
  | "message_updated"
  | "bulk_delete"
  | "disconnect_user"
  | "presence_changed";

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
 * Metrics for pub/sub operations
 */
export interface PubSubMetrics {
  messagesPublished: number;
  messagesReceived: number;
  publishFailures: number;
  averageLatencyMs: number;
  maxLatencyMs: number;
  isDegraded: boolean;
  uptime: number;
}

/**
 * Manages Redis pub/sub for cross-instance WebSocket communication.
 * Allows multiple API instances to broadcast messages to all connected clients.
 */
export class ChatPubSubManager {
  private publisher: Redis;
  private subscriber: Redis;
  private chatManager: ChatManager;
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

  constructor(chatManager: ChatManager) {
    this.chatManager = chatManager;
    this.publisher = getRedisPubSubPublisher();
    this.subscriber = getRedisPubSubSubscriber();
  }

  /**
   * Start the pub/sub manager and subscribe to channels
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      appLogger.warn("ChatPubSubManager already started");
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
      await this.subscriber.subscribe(
        CHANNELS.BROADCAST,
        CHANNELS.PRESENCE,
        CHANNELS.CONTROL,
      );

      this.isStarted = true;
      appLogger.info(
        { instanceId: INSTANCE_ID },
        "ChatPubSubManager started and subscribed to channels",
      );
    } catch (error) {
      appLogger.error({ error }, "Failed to start ChatPubSubManager");
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
      await this.subscriber.unsubscribe(
        CHANNELS.BROADCAST,
        CHANNELS.PRESENCE,
        CHANNELS.CONTROL,
      );
      this.isStarted = false;
      appLogger.info("ChatPubSubManager stopped");
    } catch (error) {
      appLogger.error({ error }, "Error stopping ChatPubSubManager");
    }
  }

  /**
   * Publish a new chat message to all instances
   */
  async publishMessage(
    message: ChatMessage | { type: string; userId: string; deletedCount: number },
  ): Promise<void> {
    const pubsubMessage: PubSubMessage = {
      type: "new_message",
      instanceId: INSTANCE_ID,
      timestamp: Date.now(),
      data: message,
    };

    await this.publish(CHANNELS.BROADCAST, pubsubMessage);
  }

  /**
   * Publish a message deletion to all instances
   */
  async publishDeletion(messageId: string): Promise<void> {
    const pubsubMessage: PubSubMessage = {
      type: "message_deleted",
      instanceId: INSTANCE_ID,
      timestamp: Date.now(),
      data: { messageId },
    };

    await this.publish(CHANNELS.BROADCAST, pubsubMessage);
  }

  /**
   * Publish a message update to all instances
   */
  async publishUpdate(message: ChatMessage): Promise<void> {
    const pubsubMessage: PubSubMessage = {
      type: "message_updated",
      instanceId: INSTANCE_ID,
      timestamp: Date.now(),
      data: message,
    };

    await this.publish(CHANNELS.BROADCAST, pubsubMessage);
  }

  /**
   * Publish a user disconnect command to all instances
   */
  async publishDisconnectUser(userId: string, reason: string): Promise<void> {
    const pubsubMessage: PubSubMessage = {
      type: "disconnect_user",
      instanceId: INSTANCE_ID,
      timestamp: Date.now(),
      data: { userId, reason },
    };

    await this.publish(CHANNELS.CONTROL, pubsubMessage);
  }

  /**
   * Publish a presence update to all instances
   */
  async publishPresenceUpdate(counts: {
    guests: number;
    members: number;
    admins: number;
  }): Promise<void> {
    const pubsubMessage: PubSubMessage = {
      type: "presence_changed",
      instanceId: INSTANCE_ID,
      timestamp: Date.now(),
      data: counts,
    };

    await this.publish(CHANNELS.PRESENCE, pubsubMessage);
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
      // (Each instance will broadcast to its own local clients directly)
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
      switch (channel) {
        case CHANNELS.BROADCAST:
          this.handleBroadcastMessage(parsed);
          break;
        case CHANNELS.PRESENCE:
          this.handlePresenceMessage(parsed);
          break;
        case CHANNELS.CONTROL:
          this.handleControlMessage(parsed);
          break;
        default:
          appLogger.warn({ channel }, "Unknown pub/sub channel");
      }
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
   * Handle broadcast messages (new messages, deletions, updates)
   */
  private handleBroadcastMessage(message: PubSubMessage): void {
    switch (message.type) {
      case "new_message": {
        const chatMessage = message.data as
          | ChatMessage
          | { type: string; userId: string; deletedCount: number };

        // Deduplicate based on message ID (if available)
        if ("id" in chatMessage && this.isDuplicateMessage(chatMessage.id)) {
          appLogger.debug({ messageId: chatMessage.id }, "Skipping duplicate message");
          return;
        }

        this.chatManager.broadcastLocal(chatMessage);
        break;
      }
      case "message_deleted": {
        const { messageId } = message.data as { messageId: string };

        // Deduplicate deletion events
        const dedupKey = `del:${messageId}`;
        if (this.isDuplicateMessage(dedupKey)) {
          appLogger.debug({ messageId }, "Skipping duplicate deletion");
          return;
        }

        this.chatManager.broadcastDeletionLocal(messageId);
        break;
      }
      case "message_updated": {
        const chatMessage = message.data as ChatMessage;

        // Deduplicate update events
        const dedupKey = `upd:${chatMessage.id}`;
        if (this.isDuplicateMessage(dedupKey)) {
          appLogger.debug({ messageId: chatMessage.id }, "Skipping duplicate update");
          return;
        }

        this.chatManager.broadcastUpdateLocal(chatMessage);
        break;
      }
      default:
        appLogger.warn({ type: message.type }, "Unknown broadcast message type");
    }
  }

  /**
   * Handle presence update messages
   */
  private handlePresenceMessage(message: PubSubMessage): void {
    if (message.type === "presence_changed") {
      const counts = message.data as {
        guests: number;
        members: number;
        admins: number;
      };
      this.chatManager.broadcastPresenceLocal(counts);
    }
  }

  /**
   * Handle control messages (disconnect user, etc.)
   */
  private handleControlMessage(message: PubSubMessage): void {
    if (message.type === "disconnect_user") {
      const { userId, reason } = message.data as {
        userId: string;
        reason: string;
      };
      this.chatManager.disconnectUserLocal(userId, reason);
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
      await this.subscriber.subscribe(
        CHANNELS.BROADCAST,
        CHANNELS.PRESENCE,
        CHANNELS.CONTROL,
      );
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
   * Get pub/sub metrics for monitoring and observability
   */
  getMetrics(): PubSubMetrics {
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
