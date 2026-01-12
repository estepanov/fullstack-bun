import { appLogger } from "../utils/logger";
import { chatPresenceService } from "./chat-presence";
import { INSTANCE_ID } from "./instance-id";
import { redis } from "./redis";

/**
 * Instance metadata stored in Redis
 */
interface InstanceMetadata {
  instanceId: string;
  startedAt: number;
  lastHeartbeat: number;
  connectedClients: number;
}

/**
 * Manages instance heartbeat for detecting and cleaning up dead instances
 */
export class InstanceHeartbeat {
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly heartbeatIntervalMs = 10_000; // 10 seconds
  private readonly cleanupIntervalMs = 30_000; // 30 seconds
  private readonly instanceTtlSeconds = 30; // 30 seconds
  private readonly instanceDeadThresholdMs = 45_000; // 45 seconds
  private startedAt = 0;

  /**
   * Start sending heartbeats and monitoring for dead instances
   */
  async start(getConnectedClients: () => number): Promise<void> {
    this.startedAt = Date.now();

    // Send initial heartbeat
    await this.sendHeartbeat(getConnectedClients());

    // Set up periodic heartbeat
    this.heartbeatIntervalId = setInterval(async () => {
      await this.sendHeartbeat(getConnectedClients());
    }, this.heartbeatIntervalMs);

    // Set up periodic cleanup of dead instances
    this.cleanupIntervalId = setInterval(async () => {
      await this.cleanupDeadInstances();
    }, this.cleanupIntervalMs);

    appLogger.info({ instanceId: INSTANCE_ID }, "Instance heartbeat started");
  }

  /**
   * Stop heartbeat and remove instance from registry
   */
  async stop(): Promise<void> {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }

    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }

    // Remove this instance from registry
    try {
      await redis.del(this.getInstanceKey(INSTANCE_ID));
      appLogger.info({ instanceId: INSTANCE_ID }, "Instance heartbeat stopped");
    } catch (error) {
      appLogger.error({ error }, "Failed to remove instance from registry");
    }
  }

  /**
   * Send heartbeat to Redis
   */
  private async sendHeartbeat(connectedClients: number): Promise<void> {
    try {
      const metadata: InstanceMetadata = {
        instanceId: INSTANCE_ID,
        startedAt: this.startedAt,
        lastHeartbeat: Date.now(),
        connectedClients,
      };

      const key = this.getInstanceKey(INSTANCE_ID);
      await redis.setex(key, this.instanceTtlSeconds, JSON.stringify(metadata));
    } catch (error) {
      appLogger.error({ error }, "Failed to send heartbeat");
    }
  }

  /**
   * Check for dead instances and clean up their presence entries
   */
  private async cleanupDeadInstances(): Promise<void> {
    try {
      // Get all instance keys
      const pattern = "chat:instances:*";
      const keys = await redis.keys(pattern);

      if (keys.length === 0) {
        return;
      }

      const now = Date.now();

      for (const key of keys) {
        try {
          const data = await redis.get(key);
          if (!data) {
            continue;
          }

          const metadata: InstanceMetadata = JSON.parse(data);

          // Check if instance is dead (no heartbeat for >45s)
          if (now - metadata.lastHeartbeat > this.instanceDeadThresholdMs) {
            appLogger.warn(
              {
                instanceId: metadata.instanceId,
                lastHeartbeat: new Date(metadata.lastHeartbeat).toISOString(),
              },
              "Detected dead instance, cleaning up",
            );

            // Instance is dead - remove it
            await redis.del(key);

            // Note: Presence entries will be cleaned up by
            // ChatPresenceService.pruneStalePresence() based on TTL
            // No need to manually clean them here
          }
        } catch (error) {
          appLogger.error({ error, key }, "Failed to process instance");
        }
      }
    } catch (error) {
      appLogger.error({ error }, "Failed to cleanup dead instances");
    }
  }

  /**
   * Get Redis key for an instance
   */
  private getInstanceKey(instanceId: string): string {
    return `chat:instances:${instanceId}`;
  }

  /**
   * Get list of active instances
   */
  async getActiveInstances(): Promise<InstanceMetadata[]> {
    try {
      const pattern = "chat:instances:*";
      const keys = await redis.keys(pattern);

      const instances: InstanceMetadata[] = [];

      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          try {
            instances.push(JSON.parse(data));
          } catch (error) {
            appLogger.error({ error, key }, "Failed to parse instance metadata");
          }
        }
      }

      return instances;
    } catch (error) {
      appLogger.error({ error }, "Failed to get active instances");
      return [];
    }
  }
}

// Export singleton instance
export const instanceHeartbeat = new InstanceHeartbeat();
