import type { SSEStreamingApi } from "hono/streaming";
import { NOTIFICATION_CONFIG } from "shared/config/notification";
import type { Notification } from "shared/interfaces/notification";
import { NotificationSSEEventType } from "shared/interfaces/notification";
import { env } from "../env";
import { appLogger } from "../utils/logger";
import { INSTANCE_ID } from "./instance-id";
import type { NotificationPubSubManager } from "./notification-pubsub";

interface ConnectedSSEClient {
  stream: SSEStreamingApi;
  userId: string;
  lastSeenAt: number;
  abortController: AbortController;
  keepAliveIntervalId: ReturnType<typeof setInterval>;
}

/**
 * Manages SSE connections for notification delivery
 * Handles local connections and coordinates with pub/sub for cross-instance broadcasting
 */
export class NotificationSSEManager {
  private clients: Map<string, ConnectedSSEClient> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private pruneIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly presenceTimeoutMs = NOTIFICATION_CONFIG.ssePresenceTimeout;
  private readonly pruneIntervalMs = NOTIFICATION_CONFIG.ssePruneInterval;
  private readonly keepAliveIntervalMs = NOTIFICATION_CONFIG.sseKeepAliveInterval;
  private readonly instanceId: string = INSTANCE_ID;
  private pubsubManager: NotificationPubSubManager | null = null;
  private isShuttingDown = false;

  /**
   * Initialize pub/sub manager for horizontal scaling
   * Should be called once during app startup
   */
  setPubSubManager(manager: NotificationPubSubManager) {
    this.pubsubManager = manager;
  }

  /**
   * Add a client connection
   * @returns clientId for the connection
   */
  addClient(params: {
    stream: SSEStreamingApi;
    userId: string;
    abortController: AbortController;
  }): string {
    // Guard against adding clients during shutdown
    if (this.isShuttingDown) {
      appLogger.warn("Rejecting new client connection during shutdown");
      params.abortController.abort("Server is shutting down");
      return "";
    }

    // Generate unique client ID
    const clientId = crypto.randomUUID();

    // Start keep-alive for this client
    const keepAliveIntervalId = this.startKeepAlive(clientId, params.stream);

    const client: ConnectedSSEClient = {
      stream: params.stream,
      userId: params.userId,
      lastSeenAt: Date.now(),
      abortController: params.abortController,
      keepAliveIntervalId,
    };

    this.clients.set(clientId, client);

    // Track user connections for user-specific broadcasting
    if (!this.userConnections.has(params.userId)) {
      this.userConnections.set(params.userId, new Set());
    }
    const userConns = this.userConnections.get(params.userId);
    if (userConns) {
      userConns.add(clientId);
    }

    if (!this.pruneIntervalId) {
      this.pruneIntervalId = setInterval(
        () => this.pruneStaleClients(),
        this.pruneIntervalMs,
      );
    }

    appLogger.info(
      {
        instanceId: this.instanceId,
        totalClients: this.clients.size,
        userId: params.userId,
        clientId,
      },
      "Notification SSE client connected",
    );

    return clientId;
  }

  /**
   * Remove a client connection
   */
  removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    // Clear keep-alive interval
    clearInterval(client.keepAliveIntervalId);

    // Abort the connection
    try {
      client.abortController.abort("Client disconnected");
    } catch (error) {
      appLogger.error({ error, clientId }, "Failed to abort client controller");
    }

    this.clients.delete(clientId);

    // Remove from user connections map
    const userClientSet = this.userConnections.get(client.userId);
    if (userClientSet) {
      userClientSet.delete(clientId);
      if (userClientSet.size === 0) {
        this.userConnections.delete(client.userId);
      }
    }

    appLogger.info(
      {
        instanceId: this.instanceId,
        totalClients: this.clients.size,
        userId: client.userId,
        clientId,
      },
      "Notification SSE client disconnected",
    );
  }

  /**
   * Update user's last seen timestamp (called from heartbeat endpoint)
   */
  touchUser(userId: string) {
    const userClientSet = this.userConnections.get(userId);
    if (!userClientSet || userClientSet.size === 0) {
      return;
    }

    const now = Date.now();
    for (const clientId of userClientSet) {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastSeenAt = now;
      }
    }
  }

  /**
   * Check if a user is currently online (has active SSE connections)
   */
  isUserOnline(userId: string): boolean {
    const userClientSet = this.userConnections.get(userId);
    return userClientSet !== undefined && userClientSet.size > 0;
  }

  /**
   * Start keep-alive interval for a client
   */
  private startKeepAlive(
    clientId: string,
    stream: SSEStreamingApi,
  ): ReturnType<typeof setInterval> {
    return setInterval(async () => {
      const client = this.clients.get(clientId);
      if (!client) {
        return;
      }

      try {
        await stream.writeSSE({
          event: NotificationSSEEventType.KEEP_ALIVE,
          data: JSON.stringify({
            type: NotificationSSEEventType.KEEP_ALIVE,
            timestamp: Date.now(),
          }),
        });

        // Update last seen on successful keep-alive
        client.lastSeenAt = Date.now();
      } catch (error) {
        appLogger.error(
          { error, clientId, userId: client.userId },
          "Failed to send keep-alive, removing client",
        );
        // Remove client on keep-alive failure
        this.removeClient(clientId);
      }
    }, this.keepAliveIntervalMs);
  }

  /**
   * Broadcast new notification to user
   */
  broadcastNewNotification(notification: Notification) {
    // Use pub/sub for cross-instance broadcasting if enabled
    if (env.ENABLE_DISTRIBUTED_CHAT && this.pubsubManager) {
      this.pubsubManager.publishNewNotification(notification);
      // Also broadcast locally
      this.broadcastNewNotificationLocal(notification);
    } else {
      // Fallback to local-only broadcast
      this.broadcastNewNotificationLocal(notification);
    }
  }

  /**
   * Broadcast new notification to local SSE clients only
   * Called by pub/sub handler for cross-instance messages
   */
  broadcastNewNotificationLocal(notification: Notification) {
    const payload = {
      type: NotificationSSEEventType.NEW_NOTIFICATION,
      notification,
    };

    this.sendToUser(
      notification.userId,
      NotificationSSEEventType.NEW_NOTIFICATION,
      payload,
    );
  }

  /**
   * Broadcast notification update to user
   */
  broadcastNotificationUpdate(notification: Notification) {
    // Use pub/sub for cross-instance broadcasting if enabled
    if (env.ENABLE_DISTRIBUTED_CHAT && this.pubsubManager) {
      this.pubsubManager.publishNotificationUpdate(notification);
      // Also broadcast locally
      this.broadcastNotificationUpdateLocal(notification);
    } else {
      // Fallback to local-only broadcast
      this.broadcastNotificationUpdateLocal(notification);
    }
  }

  /**
   * Broadcast notification update to local SSE clients only
   * Called by pub/sub handler for cross-instance messages
   */
  broadcastNotificationUpdateLocal(notification: Notification) {
    const payload = {
      type: NotificationSSEEventType.NOTIFICATION_UPDATED,
      notification,
    };

    this.sendToUser(
      notification.userId,
      NotificationSSEEventType.NOTIFICATION_UPDATED,
      payload,
    );
  }

  /**
   * Broadcast notification deletion to user
   */
  broadcastNotificationDeletion(notificationId: string, userId: string) {
    // Use pub/sub for cross-instance broadcasting if enabled
    if (env.ENABLE_DISTRIBUTED_CHAT && this.pubsubManager) {
      this.pubsubManager.publishNotificationDeletion(notificationId, userId);
      // Also broadcast locally
      this.broadcastNotificationDeletionLocal(notificationId, userId);
    } else {
      // Fallback to local-only broadcast
      this.broadcastNotificationDeletionLocal(notificationId, userId);
    }
  }

  /**
   * Broadcast notification deletion to local SSE clients only
   * Called by pub/sub handler for cross-instance messages
   */
  broadcastNotificationDeletionLocal(notificationId: string, userId: string) {
    const payload = {
      type: NotificationSSEEventType.NOTIFICATION_DELETED,
      notificationId,
    };

    this.sendToUser(userId, NotificationSSEEventType.NOTIFICATION_DELETED, payload);
  }

  /**
   * Broadcast notifications cleared to user
   */
  broadcastNotificationsCleared(userId: string, deletedCount: number) {
    // Use pub/sub for cross-instance broadcasting if enabled
    if (env.ENABLE_DISTRIBUTED_CHAT && this.pubsubManager) {
      this.pubsubManager.publishNotificationsCleared(userId, deletedCount);
      // Also broadcast locally
      this.broadcastNotificationsClearedLocal(userId, deletedCount);
    } else {
      // Fallback to local-only broadcast
      this.broadcastNotificationsClearedLocal(userId, deletedCount);
    }
  }

  /**
   * Broadcast notifications cleared to local SSE clients only
   * Called by pub/sub handler for cross-instance messages
   */
  broadcastNotificationsClearedLocal(userId: string, deletedCount: number) {
    const payload = {
      type: NotificationSSEEventType.NOTIFICATIONS_CLEARED,
      deletedCount,
    };

    this.sendToUser(userId, NotificationSSEEventType.NOTIFICATIONS_CLEARED, payload);
  }

  /**
   * Broadcast unread count change to user
   */
  broadcastUnreadCountChange(userId: string, unreadCount: number) {
    // Use pub/sub for cross-instance broadcasting if enabled
    if (env.ENABLE_DISTRIBUTED_CHAT && this.pubsubManager) {
      this.pubsubManager.publishUnreadCountChange(userId, unreadCount);
      // Also broadcast locally
      this.broadcastUnreadCountChangeLocal(userId, unreadCount);
    } else {
      // Fallback to local-only broadcast
      this.broadcastUnreadCountChangeLocal(userId, unreadCount);
    }
  }

  /**
   * Broadcast unread count change to local SSE clients only
   * Called by pub/sub handler for cross-instance messages
   */
  broadcastUnreadCountChangeLocal(userId: string, unreadCount: number) {
    const payload = {
      type: NotificationSSEEventType.UNREAD_COUNT_CHANGED,
      unreadCount,
    };

    this.sendToUser(userId, NotificationSSEEventType.UNREAD_COUNT_CHANGED, payload);
  }

  /**
   * Send an event to all connections for a specific user
   */
  private async sendToUser(
    userId: string,
    eventType: NotificationSSEEventType,
    payload: unknown,
  ) {
    const userClientSet = this.userConnections.get(userId);
    if (!userClientSet || userClientSet.size === 0) {
      appLogger.debug({ userId }, "No SSE connections found for user");
      return;
    }

    const dataStr = JSON.stringify(payload);
    let sent = 0;
    let failed = 0;

    for (const clientId of userClientSet) {
      const client = this.clients.get(clientId);
      if (!client) {
        continue;
      }

      try {
        await client.stream.writeSSE({
          event: eventType,
          data: dataStr,
        });
        sent++;
      } catch (error) {
        appLogger.error(
          { error, userId, clientId },
          "Failed to send to user SSE connection",
        );
        failed++;
        // Remove client on send failure
        this.removeClient(clientId);
      }
    }

    appLogger.debug(
      { instanceId: this.instanceId, userId, sent, failed },
      "Sent SSE event to user",
    );
  }

  /**
   * Get total client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get count of online users
   */
  getOnlineUserCount(): number {
    return this.userConnections.size;
  }

  /**
   * Prune stale clients (no activity for presence timeout)
   */
  private pruneStaleClients() {
    if (this.clients.size === 0) {
      if (this.pruneIntervalId) {
        clearInterval(this.pruneIntervalId);
        this.pruneIntervalId = null;
      }
      return;
    }

    const now = Date.now();
    let removed = 0;

    for (const [clientId, client] of this.clients) {
      if (now - client.lastSeenAt <= this.presenceTimeoutMs) {
        continue;
      }

      appLogger.debug({ clientId, userId: client.userId }, "Pruning stale SSE client");

      this.removeClient(clientId);
      removed++;
    }

    if (removed > 0) {
      appLogger.debug({ removed }, "Pruned stale SSE notification clients");
    }
  }

  /**
   * Gracefully shutdown the notification manager
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    appLogger.info("Shutting down NotificationSSEManager...");

    // Notify all connected clients
    for (const [clientId, client] of this.clients.entries()) {
      try {
        await client.stream.writeSSE({
          event: NotificationSSEEventType.ERROR,
          data: JSON.stringify({
            type: NotificationSSEEventType.ERROR,
            error: "Server is shutting down. Please reconnect in a moment.",
          }),
        });
      } catch (error) {
        appLogger.error({ error, clientId }, "Failed to notify client of shutdown");
      }
    }

    // Wait briefly for messages to send
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Close all connections
    for (const clientId of this.clients.keys()) {
      this.removeClient(clientId);
    }

    this.clients.clear();
    this.userConnections.clear();

    // Clear intervals
    if (this.pruneIntervalId) {
      clearInterval(this.pruneIntervalId);
      this.pruneIntervalId = null;
    }

    appLogger.info("NotificationSSEManager shutdown complete");
  }
}

// Singleton instance
export const notificationSSEManager = new NotificationSSEManager();
