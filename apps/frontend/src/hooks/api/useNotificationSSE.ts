import { apiClient } from "@frontend/lib/api-client";
import { createNotificationSSEClient } from "frontend-common/notification";
import type { NotificationSSEClient } from "frontend-common/notification";
import { useCallback, useEffect, useRef, useState } from "react";
import { NOTIFICATION_CONFIG } from "shared/config/notification";
import type { Notification, SSENotificationEvent } from "shared/interfaces/notification";
import { NotificationSSEEventType } from "shared/interfaces/notification";

export interface UseNotificationSSEReturn {
  notifications: Notification[];
  unreadCount: number;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  error: string | null;
}

const MAX_NOTIFICATIONS = NOTIFICATION_CONFIG.maxInMemoryNotifications;
const HEARTBEAT_INTERVAL = NOTIFICATION_CONFIG.clientHeartbeatInterval;

export const useNotificationSSE = (): UseNotificationSSEReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<NotificationSSEClient | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInitiallyFetchedRef = useRef(false);
  const lastDisconnectTimeRef = useRef<number>(0);
  const isManualCloseRef = useRef(false);

  const fetchInitialNotifications = useCallback(async () => {
    try {
      console.log("[SSE] Fetching initial notifications...");
      const res = await apiClient.notification.list.$get({
        query: {
          page: 1,
          limit: MAX_NOTIFICATIONS,
          filter: "all",
        },
      });
      const data = await res.json();
      console.log("[SSE] Initial notifications response:", data);
      if (data.success && "notifications" in data) {
        console.log("[SSE] Setting", data.notifications.length, "notifications");
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("[SSE] Failed to fetch initial notifications:", error);
    }
  }, []);

  const handleMessage = useCallback(
    (data: SSENotificationEvent) => {
      try {
        console.log("[SSE] Received event:", data.type, data);
        switch (data.type) {
          case NotificationSSEEventType.CONNECTED: {
            console.log("[SSE] CONNECTED event - unreadCount:", data.unreadCount);
            setUnreadCount(data.unreadCount || 0);

            // Only refetch notifications if:
            // 1. We haven't fetched yet (shouldn't happen, but safety check)
            // 2. We've been disconnected for more than 30 seconds (might have missed events)
            const now = Date.now();
            const timeSinceDisconnect =
              lastDisconnectTimeRef.current > 0 ? now - lastDisconnectTimeRef.current : 0;
            const shouldRefetch =
              !hasInitiallyFetchedRef.current ||
              (lastDisconnectTimeRef.current > 0 && timeSinceDisconnect > 30000);

            if (shouldRefetch) {
              console.log(
                "[SSE] Refetching notifications (time since disconnect:",
                timeSinceDisconnect,
                "ms)",
              );
              fetchInitialNotifications();
            } else {
              console.log(
                "[SSE] Skipping refetch - quick reconnect (",
                timeSinceDisconnect,
                "ms)",
              );
            }
            break;
          }

          case NotificationSSEEventType.NEW_NOTIFICATION:
            setNotifications((prev) => {
              // Check if notification already exists to prevent duplicates
              if (prev.some((notif) => notif.id === data.notification.id)) {
                return prev;
              }
              const newNotifications = [data.notification, ...prev];
              // Trim to last MAX_NOTIFICATIONS
              if (newNotifications.length > MAX_NOTIFICATIONS) {
                return newNotifications.slice(0, MAX_NOTIFICATIONS);
              }
              return newNotifications;
            });
            break;

          case NotificationSSEEventType.NOTIFICATION_UPDATED:
            setNotifications((prev) =>
              prev.map((notif) =>
                notif.id === data.notification.id ? data.notification : notif,
              ),
            );
            break;

          case NotificationSSEEventType.NOTIFICATION_DELETED:
            setNotifications((prev) =>
              prev.filter((notif) => notif.id !== data.notificationId),
            );
            break;

          case NotificationSSEEventType.UNREAD_COUNT_CHANGED:
            setUnreadCount(data.unreadCount);
            break;

          case NotificationSSEEventType.KEEP_ALIVE:
            // Ignore keep-alive events (server-side heartbeat)
            break;

          case NotificationSSEEventType.ERROR:
            setError(data.error);
            // Clear error after 5 seconds
            setTimeout(() => setError(null), 5000);
            break;

          default:
            // biome-ignore lint/complexity/useLiteralKeys: type err
            console.warn("Unknown notification SSE event type:", data?.["type"]);
        }
      } catch (err) {
        console.error("Error handling notification SSE message:", err);
      }
    },
    [fetchInitialNotifications], // Include fetchInitialNotifications for reconnection handling
  );

  const connect = useCallback(() => {
    const client = clientRef.current;
    if (client?.isConnected()) {
      console.log("[SSE] Already connected");
      return;
    }

    console.log("[SSE] Connecting to SSE stream...");
    isManualCloseRef.current = false;
    setConnectionStatus("connecting");
    setError(null);

    try {
      // Create a new SSE client instance with callbacks
      const newClient = createNotificationSSEClient({
        baseURL: import.meta.env.VITE_API_BASE_URL || "",
        onMessage: handleMessage,
        onOpen: () => {
          console.log("[SSE] Connection opened");
          setConnectionStatus("connected");

          // Start optional heartbeat via REST
          if (HEARTBEAT_INTERVAL > 0) {
            if (heartbeatIntervalRef.current) {
              clearInterval(heartbeatIntervalRef.current);
            }
            heartbeatIntervalRef.current = setInterval(() => {
              apiClient.notification.heartbeat.$post({}).catch((err) => {
                console.error("Failed to send heartbeat:", err);
              });
            }, HEARTBEAT_INTERVAL);
          }
        },
        onError: (event: Event) => {
          console.error("Notification SSE error:", event);
          // EventSource will automatically attempt to reconnect
          // We don't need to manage reconnection logic manually
        },
        onClose: () => {
          console.log("Notification SSE stream closed");
          setConnectionStatus("disconnected");
          clientRef.current = null;

          // Track when we disconnected
          lastDisconnectTimeRef.current = Date.now();

          // Clear heartbeat
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }

          // EventSource handles reconnection automatically
          // No manual reconnection logic needed
        },
      });

      clientRef.current = newClient;
      newClient.connect();
    } catch (err) {
      console.error("Failed to create notification SSE client:", err);
      setConnectionStatus("error");
      setError("Failed to create connection");
    }
  }, [handleMessage]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      isManualCloseRef.current = true;
      clientRef.current.disconnect();
      clientRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Reset flags on disconnect so that remounting works correctly
    hasInitiallyFetchedRef.current = false;
    lastDisconnectTimeRef.current = Date.now();

    setConnectionStatus("disconnected");
  }, []);

  // Fetch initial notifications and connect to SSE on mount
  useEffect(() => {
    // Fetch initial notifications first (before SSE connection)
    // This ensures we have data before the CONNECTED event fires
    fetchInitialNotifications().then(() => {
      hasInitiallyFetchedRef.current = true;
    });

    // Then connect to SSE for real-time updates
    // The connect() function has its own check to prevent duplicate connections
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect, fetchInitialNotifications]);

  // Keep local notification state in sync when all items become read (e.g., mark-all action)
  useEffect(() => {
    if (unreadCount === 0) {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.read ? notification : { ...notification, read: true },
        ),
      );
    }
  }, [unreadCount]);

  return {
    notifications,
    unreadCount,
    connectionStatus,
    error,
  };
};
