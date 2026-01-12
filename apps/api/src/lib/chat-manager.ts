import type { WSContext } from "hono/ws";
import type { ChatMessage } from "shared/interfaces/chat";
import { ChatWSMessageType } from "shared/interfaces/chat";
import { env } from "../env";
import { appLogger } from "../utils/logger";
import type { ChatPresenceService } from "./chat-presence";
import type { ChatPubSubManager } from "./chat-pubsub";
import { INSTANCE_ID } from "./instance-id";

export type ClientRole = "guest" | "member" | "admin";

interface ConnectedClient {
  ws: WSContext;
  userId: string | null;
  userName: string | null;
  role: ClientRole;
  presenceId: string;
  lastSeenAt: number;
}

export class ChatManager {
  private clients: Map<WSContext, ConnectedClient> = new Map();
  private pruneIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly presenceTimeoutMs = 30_000;
  private readonly pruneIntervalMs = 10_000;

  // Horizontal scaling support
  private instanceId: string = INSTANCE_ID;
  private presenceService: ChatPresenceService | null = null;
  private pubsubManager: ChatPubSubManager | null = null;
  private isShuttingDown = false;
  private presenceDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly presenceDebounceMs = 500;

  /**
   * Initialize pub/sub and presence services for horizontal scaling
   * Should be called once during app startup
   */
  setPresenceService(service: ChatPresenceService) {
    this.presenceService = service;
  }

  setPubSubManager(manager: ChatPubSubManager) {
    this.pubsubManager = manager;
  }

  addClient(client: Omit<ConnectedClient, "lastSeenAt">) {
    // Guard against adding clients during shutdown
    if (this.isShuttingDown) {
      appLogger.warn("Rejecting new client connection during shutdown");
      try {
        client.ws.close(1001, "Server is shutting down");
      } catch (error) {
        appLogger.error({ error }, "Failed to close rejected client");
      }
      return;
    }
    const stampedClient = {
      ...client,
      lastSeenAt: Date.now(),
    };
    this.clients.set(client.ws, stampedClient);

    // Add to shared presence tracking if enabled
    if (this.presenceService) {
      this.presenceService.addPresence(client.presenceId, client.role);
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
        presenceId: client.presenceId,
        role: client.role,
      },
      "Chat client connected",
    );

    this.schedulePresenceBroadcast();
  }

  removeClient(client: Omit<ConnectedClient, "lastSeenAt">) {
    this.clients.delete(client.ws);

    // Remove from shared presence tracking if enabled
    if (this.presenceService) {
      this.presenceService.removePresence(client.presenceId, client.role);
    }

    appLogger.info(
      {
        instanceId: this.instanceId,
        totalClients: this.clients.size,
        presenceId: client.presenceId,
        role: client.role,
      },
      "Chat client disconnected",
    );

    this.schedulePresenceBroadcast();
  }

  touchClient(ws: WSContext) {
    const client = this.clients.get(ws);
    if (!client) {
      return;
    }
    client.lastSeenAt = Date.now();

    // Update shared presence tracking if enabled
    if (this.presenceService) {
      this.presenceService.touchPresence(client.presenceId, client.role);
    }
  }

  broadcast(
    message: ChatMessage | { type: string; userId: string; deletedCount: number },
  ) {
    // Use pub/sub for cross-instance broadcasting if enabled
    if (env.ENABLE_DISTRIBUTED_CHAT && this.pubsubManager) {
      this.pubsubManager.publishMessage(message);
      // Also broadcast locally (pub/sub will echo to all instances including this one)
      this.broadcastLocal(message);
    } else {
      // Fallback to local-only broadcast
      this.broadcastLocal(message);
    }
  }

  /**
   * Broadcast message to local WebSocket clients only
   * Called by pub/sub handler for cross-instance messages
   */
  broadcastLocal(
    message: ChatMessage | { type: string; userId: string; deletedCount: number },
  ) {
    const payload =
      "id" in message
        ? {
            type: ChatWSMessageType.NEW_MESSAGE,
            data: message,
          }
        : message;

    const messageStr = JSON.stringify(payload);
    let sent = 0;
    let failed = 0;

    for (const client of this.clients.values()) {
      try {
        client.ws.send(messageStr);
        sent++;
      } catch (error) {
        appLogger.error({ error }, "Failed to send to client");
        failed++;
      }
    }

    appLogger.debug(
      { instanceId: this.instanceId, sent, failed },
      "Broadcast message locally",
    );
  }

  broadcastDeletion(messageId: string) {
    // Use pub/sub for cross-instance broadcasting if enabled
    if (env.ENABLE_DISTRIBUTED_CHAT && this.pubsubManager) {
      this.pubsubManager.publishDeletion(messageId);
      // Also broadcast locally
      this.broadcastDeletionLocal(messageId);
    } else {
      // Fallback to local-only broadcast
      this.broadcastDeletionLocal(messageId);
    }
  }

  /**
   * Broadcast deletion to local WebSocket clients only
   * Called by pub/sub handler for cross-instance messages
   */
  broadcastDeletionLocal(messageId: string) {
    const payload = {
      type: ChatWSMessageType.MESSAGE_DELETED,
      messageId,
    };

    const messageStr = JSON.stringify(payload);
    let sent = 0;
    let failed = 0;

    for (const client of this.clients.values()) {
      try {
        client.ws.send(messageStr);
        sent++;
      } catch (error) {
        appLogger.error({ error }, "Failed to send deletion to client");
        failed++;
      }
    }

    appLogger.debug(
      { instanceId: this.instanceId, sent, failed },
      "Broadcast deletion locally",
    );
  }

  broadcastUpdate(message: ChatMessage) {
    // Use pub/sub for cross-instance broadcasting if enabled
    if (env.ENABLE_DISTRIBUTED_CHAT && this.pubsubManager) {
      this.pubsubManager.publishUpdate(message);
      // Also broadcast locally
      this.broadcastUpdateLocal(message);
    } else {
      // Fallback to local-only broadcast
      this.broadcastUpdateLocal(message);
    }
  }

  /**
   * Broadcast update to local WebSocket clients only
   * Called by pub/sub handler for cross-instance messages
   */
  broadcastUpdateLocal(message: ChatMessage) {
    const payload = {
      type: ChatWSMessageType.MESSAGE_UPDATED,
      data: message,
    };

    const messageStr = JSON.stringify(payload);
    let sent = 0;
    let failed = 0;

    for (const client of this.clients.values()) {
      try {
        client.ws.send(messageStr);
        sent++;
      } catch (error) {
        appLogger.error({ error }, "Failed to send update to client");
        failed++;
      }
    }

    appLogger.debug(
      { instanceId: this.instanceId, sent, failed },
      "Broadcast update locally",
    );
  }

  disconnectUser(userId: string, reason = "User has been banned") {
    // Use pub/sub for cross-instance disconnection if enabled
    if (env.ENABLE_DISTRIBUTED_CHAT && this.pubsubManager) {
      this.pubsubManager.publishDisconnectUser(userId, reason);
      // Also disconnect locally
      this.disconnectUserLocal(userId, reason);
    } else {
      // Fallback to local-only disconnect
      this.disconnectUserLocal(userId, reason);
    }
  }

  /**
   * Disconnect user on this instance only
   * Called by pub/sub handler for cross-instance messages
   */
  disconnectUserLocal(userId: string, reason: string) {
    let disconnected = 0;

    for (const [ws, client] of this.clients) {
      if (client.userId === userId) {
        try {
          client.ws.close(1008, reason);
          this.clients.delete(ws);

          // Remove from shared presence tracking
          if (this.presenceService) {
            this.presenceService.removePresence(client.presenceId, client.role);
          }

          disconnected++;
        } catch (error) {
          appLogger.error({ error }, "Failed to disconnect client");
        }
      }
    }

    if (disconnected > 0) {
      appLogger.info(
        { userId, disconnected, reason },
        `Disconnected ${disconnected} connections for user`,
      );
      this.schedulePresenceBroadcast();
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get presence counts - uses shared Redis state if available
   */
  private async getPresenceCounts() {
    // Use shared presence service if enabled
    if (this.presenceService) {
      return await this.presenceService.getPresenceCounts();
    }

    // Fallback to local counting
    const guests = new Set<string>();
    const members = new Set<string>();
    const admins = new Set<string>();

    for (const client of this.clients.values()) {
      switch (client.role) {
        case "guest":
          guests.add(client.presenceId);
          break;
        case "admin":
          admins.add(client.presenceId);
          break;
        default:
          members.add(client.presenceId);
      }
    }

    return {
      guests: guests.size,
      members: members.size,
      admins: admins.size,
    };
  }

  /**
   * Schedule a debounced presence broadcast
   * Prevents excessive presence updates
   */
  private schedulePresenceBroadcast() {
    if (this.presenceDebounceTimer) {
      clearTimeout(this.presenceDebounceTimer);
    }

    this.presenceDebounceTimer = setTimeout(async () => {
      await this.broadcastPresence();
    }, this.presenceDebounceMs);
  }

  /**
   * Broadcast presence update to all instances
   */
  private async broadcastPresence() {
    const counts = await this.getPresenceCounts();

    // Use pub/sub for cross-instance broadcasting if enabled
    if (env.ENABLE_DISTRIBUTED_CHAT && this.pubsubManager) {
      await this.pubsubManager.publishPresenceUpdate(counts);
      // Also broadcast locally
      this.broadcastPresenceLocal(counts);
    } else {
      // Fallback to local-only broadcast
      this.broadcastPresenceLocal(counts);
    }
  }

  /**
   * Broadcast presence to local WebSocket clients only
   * Called by pub/sub handler for cross-instance messages
   */
  broadcastPresenceLocal(counts: { guests: number; members: number; admins: number }) {
    const payload = {
      type: ChatWSMessageType.PRESENCE,
      data: counts,
    };
    const messageStr = JSON.stringify(payload);

    for (const client of this.clients.values()) {
      try {
        client.ws.send(messageStr);
      } catch (error) {
        appLogger.error({ error }, "Failed to send presence update to client");
      }
    }
  }

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

    for (const [ws, client] of this.clients) {
      if (now - client.lastSeenAt <= this.presenceTimeoutMs) {
        continue;
      }
      try {
        ws.close(1001, "Presence timeout");
      } catch (error) {
        appLogger.error({ error }, "Failed to close stale client");
      }
      this.clients.delete(ws);

      // Remove from shared presence tracking
      if (this.presenceService) {
        this.presenceService.removePresence(client.presenceId, client.role);
      }

      removed++;
    }

    if (removed > 0) {
      appLogger.debug({ removed }, "Pruned stale clients");
      this.schedulePresenceBroadcast();
    }

    // Also prune stale presence entries from Redis
    if (this.presenceService) {
      this.presenceService.pruneStalePresence();
    }
  }

  /**
   * Gracefully shutdown the chat manager
   * Notifies clients, closes connections, and cleans up resources
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    appLogger.info("Shutting down ChatManager...");

    // Notify all connected clients
    const shutdownMessage = JSON.stringify({
      type: ChatWSMessageType.ERROR,
      error: "Server is shutting down. Please reconnect in a moment.",
    });

    for (const client of this.clients.values()) {
      try {
        client.ws.send(shutdownMessage);
      } catch (error) {
        appLogger.error({ error }, "Failed to notify client of shutdown");
      }
    }

    // Wait briefly for messages to send
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Close all connections gracefully
    for (const [ws, client] of this.clients) {
      try {
        ws.close(1001, "Server shutdown");

        // Remove from Redis presence
        if (this.presenceService) {
          await this.presenceService.removePresence(client.presenceId, client.role);
        }
      } catch (error) {
        appLogger.error({ error }, "Failed to close client connection");
      }
    }

    this.clients.clear();

    // Clear intervals
    if (this.pruneIntervalId) {
      clearInterval(this.pruneIntervalId);
      this.pruneIntervalId = null;
    }

    if (this.presenceDebounceTimer) {
      clearTimeout(this.presenceDebounceTimer);
      this.presenceDebounceTimer = null;
    }

    appLogger.info("ChatManager shutdown complete");
  }
}

// Singleton instance
export const chatManager = new ChatManager();
