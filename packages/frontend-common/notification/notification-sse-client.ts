import type { SSENotificationEvent } from "shared/interfaces/notification";

export interface NotificationSSEClientConfig {
  baseURL: string;
  onMessage?: (message: SSENotificationEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export interface NotificationSSEClient {
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
  getEventSource: () => EventSource | null;
}

/**
 * Creates a notification SSE client using the EventSource API
 *
 * Key features:
 * - Automatic reconnection via EventSource (no manual retry logic needed)
 * - Cookie-based authentication (withCredentials: true)
 * - Event listeners for each SSE event type
 * - Simple connection management
 */
export function createNotificationSSEClient(
  config: NotificationSSEClientConfig,
): NotificationSSEClient {
  let eventSource: EventSource | null = null;

  const connect = () => {
    if (eventSource) {
      // Already connected
      return;
    }

    const url = `${config.baseURL}/notification/stream`;

    // Create EventSource with credentials for cookie-based auth
    eventSource = new EventSource(url, {
      withCredentials: true,
    });

    // Handle connection open
    eventSource.addEventListener("open", () => {
      config.onOpen?.();
    });

    // Handle errors
    eventSource.addEventListener("error", (event) => {
      config.onError?.(event);

      // If connection is closed, notify via onClose
      if (eventSource?.readyState === EventSource.CLOSED) {
        config.onClose?.();
      }
    });

    // Register listeners for each event type
    // SSE uses named events, so we listen to specific event names
    const eventTypes = [
      "connected",
      "new_notification",
      "notification_updated",
      "notification_deleted",
      "notifications_cleared",
      "unread_count_changed",
      "keep_alive",
      "error",
    ];

    for (const eventType of eventTypes) {
      eventSource.addEventListener(eventType, (event: Event) => {
        const messageEvent = event as MessageEvent;

        // Skip if no data (can happen with browser error events)
        if (!messageEvent.data) {
          console.log(`[SSE Client] Received ${eventType} event with no data, skipping`);
          return;
        }

        console.log(`[SSE Client] Received ${eventType} event:`, messageEvent.data);
        try {
          const data = JSON.parse(messageEvent.data) as SSENotificationEvent;
          config.onMessage?.(data);
        } catch (error) {
          console.error("[SSE Client] Failed to parse SSE message:", error, messageEvent.data);
        }
      });
    }
  };

  const disconnect = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      config.onClose?.();
    }
  };

  const isConnected = (): boolean => {
    return eventSource !== null && eventSource.readyState === EventSource.OPEN;
  };

  const getEventSource = (): EventSource | null => {
    return eventSource;
  };

  return {
    connect,
    disconnect,
    isConnected,
    getEventSource,
  };
}
