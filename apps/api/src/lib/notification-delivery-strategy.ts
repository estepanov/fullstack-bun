import type { Notification } from "shared/interfaces/notification";

/**
 * Abstract interface for notification delivery strategies
 * Implements the Strategy pattern for pluggable delivery methods
 */
export interface NotificationDeliveryStrategy {
  /**
   * Check if this strategy can deliver to the given user
   * @param userId - The user ID to check delivery capability for
   * @returns Promise resolving to true if this strategy can deliver, false otherwise
   */
  canDeliver(userId: string): Promise<boolean>;

  /**
   * Deliver the notification using this strategy
   * @param notification - The notification to deliver
   * @returns Promise resolving when delivery is complete
   */
  deliver(notification: Notification): Promise<void>;

  /**
   * Get the name of this delivery strategy for logging and debugging
   */
  readonly name: string;
}

/**
 * SSE (Server-Sent Events) delivery strategy - delivers notifications in real-time to connected clients
 *
 * Note: This strategy is used primarily for checking user online status.
 * Actual SSE broadcasting is handled separately in the notification router
 * to ensure proper coordination with unread count updates.
 */
export class SSEDeliveryStrategy implements NotificationDeliveryStrategy {
  readonly name = "sse";

  constructor(
    private isUserOnlineFn: (userId: string) => boolean,
    private broadcastFn?: (notification: Notification) => void,
  ) {}

  async canDeliver(userId: string): Promise<boolean> {
    return this.isUserOnlineFn(userId);
  }

  async deliver(notification: Notification): Promise<void> {
    // If broadcastFn is provided, use it for delivery
    // Otherwise, delivery is handled externally in the notification router
    if (this.broadcastFn) {
      this.broadcastFn(notification);
    }
  }
}

/**
 * Push notification delivery strategy (placeholder for future implementation)
 * Would integrate with web push APIs, Firebase Cloud Messaging, etc.
 */
export class PushDeliveryStrategy implements NotificationDeliveryStrategy {
  readonly name = "push";

  async canDeliver(_userId: string): Promise<boolean> {
    // TODO: Check if user has push subscription and push enabled in preferences
    return false;
  }

  async deliver(_notification: Notification): Promise<void> {
    // TODO: Implement push notification delivery
    throw new Error("Push notification delivery not implemented yet");
  }
}
