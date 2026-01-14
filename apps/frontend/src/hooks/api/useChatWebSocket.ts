import { createChatClientInstance, getGuestId } from "frontend-common/chat";
import type { ChatClient } from "frontend-common/chat";
import type { User } from "frontend-common/lib/chat-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { getChatThrottleRule } from "shared/config/chat";
import {
  type ChatMessage,
  type ChatWSMessage,
  ChatWSMessageType,
} from "shared/interfaces/chat";

export interface UseChatWebSocketReturn {
  messages: ChatMessage[];
  sendMessage: (message: string) => boolean;
  sendTypingStatus: (isTyping: boolean) => void;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  error: string | null;
  isAuthenticated: boolean;
  profileIncomplete: boolean;
  onlineCounts: { guests: number; members: number; admins: number } | null;
  typingUsers: Record<string, User[]>;
  connectedUserId: string | null;
  throttle: {
    remainingMs: number;
    limit: number;
    windowMs: number;
    restoreMessage?: string;
  } | null;
}

const MAX_MESSAGES = 100;
const TYPING_TIMEOUT_MS = 5000;

export const useChatWebSocket = ({
  roomId = "global",
}: { roomId?: string } = {}): UseChatWebSocketReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [onlineCounts, setOnlineCounts] = useState<{
    guests: number;
    members: number;
    admins: number;
  } | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, User[]>>({});
  const [connectedUserId, setConnectedUserId] = useState<string | null>(null);
  const [throttleUntil, setThrottleUntil] = useState<number | null>(null);
  const [throttleMeta, setThrottleMeta] = useState<{
    limit: number;
    windowMs: number;
  } | null>(null);
  const [throttleRemainingMs, setThrottleRemainingMs] = useState<number | null>(null);
  const [throttleRestoreMessage, setThrottleRestoreMessage] = useState<string | null>(
    null,
  );

  const clientRef = useRef<ChatClient | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const hasAttemptedRef = useRef(false);
  const isManualCloseRef = useRef(false);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isBannedRef = useRef(false);
  const lastSentMessageRef = useRef<string | null>(null);
  const recentMessageTimestampsRef = useRef<number[]>([]);
  const lastRoomIdRef = useRef<string | null>(null);
  const connectedUserIdRef = useRef<string | null>(null);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const MAX_RECONNECT_ATTEMPTS = 5;
  const throttleRule = getChatThrottleRule(roomId);
  const throttleWindowMs = throttleRule.perSeconds * 1000;

  const handleMessage = useCallback(
    (data: ChatWSMessage) => {
      switch (data.type) {
        case ChatWSMessageType.CONNECTED:
          setIsAuthenticated(!!data.userId);
          setProfileIncomplete(!!data.profileIncomplete);
          connectedUserIdRef.current = data.userId ?? null;
          setConnectedUserId(data.userId ?? null);
          break;
        case ChatWSMessageType.PRESENCE:
          setOnlineCounts(data.data);
          break;

        case ChatWSMessageType.TYPING_UPDATE: {
          const typingRoomId = data.data.roomId ?? roomId;
          if (typingRoomId !== roomId) {
            break;
          }
          if (data.data.userId === connectedUserIdRef.current) {
            break;
          }

          const typingKey = `${typingRoomId}:${data.data.userId}`;
          if (data.data.isTyping) {
            setTypingUsers((prev) => {
              const current = prev[typingRoomId] ?? [];
              if (current.some((user) => user.id === data.data.userId)) {
                return prev;
              }
              return {
                ...prev,
                [typingRoomId]: [
                  ...current,
                  {
                    id: data.data.userId,
                    name: data.data.userName,
                    avatar: data.data.userAvatar || undefined,
                    status: "online",
                  },
                ],
              };
            });

            const existingTimeout = typingTimeoutsRef.current.get(typingKey);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }
            const timeoutId = setTimeout(() => {
              setTypingUsers((prev) => {
                const current = prev[typingRoomId] ?? [];
                const next = current.filter((user) => user.id !== data.data.userId);
                if (next.length === current.length) {
                  return prev;
                }
                return {
                  ...prev,
                  [typingRoomId]: next,
                };
              });
              typingTimeoutsRef.current.delete(typingKey);
            }, TYPING_TIMEOUT_MS);
            typingTimeoutsRef.current.set(typingKey, timeoutId);
          } else {
            setTypingUsers((prev) => {
              const current = prev[typingRoomId] ?? [];
              const next = current.filter((user) => user.id !== data.data.userId);
              if (next.length === current.length) {
                return prev;
              }
              return {
                ...prev,
                [typingRoomId]: next,
              };
            });

            const existingTimeout = typingTimeoutsRef.current.get(typingKey);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
              typingTimeoutsRef.current.delete(typingKey);
            }
          }
          break;
        }

        case ChatWSMessageType.MESSAGE_HISTORY:
          setMessages(data.data);
          break;

        case ChatWSMessageType.NEW_MESSAGE:
          setMessages((prev) => {
            // Check if message already exists to prevent duplicates
            if (prev.some((msg) => msg.id === data.data.id)) {
              return prev;
            }
            const newMessages = [...prev, data.data];
            // Trim to last MAX_MESSAGES
            if (newMessages.length > MAX_MESSAGES) {
              return newMessages.slice(-MAX_MESSAGES);
            }
            return newMessages;
          });
          break;

        case ChatWSMessageType.MESSAGE_DELETED:
          setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
          break;

        case ChatWSMessageType.MESSAGE_UPDATED:
          setMessages((prev) =>
            prev.map((msg) => (msg.id === data.data.id ? data.data : msg)),
          );
          break;

        case ChatWSMessageType.BULK_DELETE:
          setMessages((prev) => prev.filter((msg) => msg.userId !== data.userId));
          break;

        case ChatWSMessageType.ERROR:
          setError(data.error);
          // Check if error is due to ban
          if (data.error?.toLowerCase().includes("banned")) {
            isBannedRef.current = true;
            setConnectionStatus("error");
            // Don't clear ban error - it stays visible
          } else {
            // Clear other errors after 5 seconds
            setTimeout(() => setError(null), 5000);
          }
          break;

        case ChatWSMessageType.THROTTLED: {
          const retryAfterMs = Math.max(0, data.retryAfterMs);
          setThrottleMeta({
            limit: data.limit,
            windowMs: data.windowMs,
          });
          setThrottleRestoreMessage(lastSentMessageRef.current);
          setThrottleUntil(Date.now() + retryAfterMs);
          break;
        }

        case ChatWSMessageType.SEND_MESSAGE:
          // Client-to-server message type, should not be received
          console.warn("Received unexpected SEND_MESSAGE from server");
          break;

        case ChatWSMessageType.PING:
          // Client-to-server message type, should not be received
          console.warn("Received unexpected PING from server");
          break;

        case ChatWSMessageType.TYPING_STATUS:
          // Client-to-server message type, should not be received
          console.warn("Received unexpected TYPING_STATUS from server");
          break;

        default: {
          // Exhaustive check: if we add a new message type and don't handle it,
          // TypeScript will error here because data.type won't be assignable to never
          const _exhaustiveCheck: never = data;
          console.warn("Unhandled message type:", _exhaustiveCheck);
          break;
        }
      }
    },
    [roomId],
  );

  const connect = useCallback(() => {
    const client = clientRef.current;
    if (client?.isConnected()) {
      return;
    }

    // Don't reconnect if user is banned
    if (isBannedRef.current) {
      return;
    }

    hasAttemptedRef.current = true;
    isManualCloseRef.current = false;
    setConnectionStatus("connecting");
    setError(null);

    try {
      // Create a new client instance with callbacks
      const newClient = createChatClientInstance({
        baseURL: import.meta.env.VITE_API_BASE_URL || "",
        onMessage: handleMessage,
        onOpen: () => {
          console.log("WebSocket connected");
          setConnectionStatus("connected");
          reconnectAttemptsRef.current = 0;
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
          }
          heartbeatIntervalRef.current = setInterval(() => {
            if (clientRef.current?.isConnected()) {
              clientRef.current.send({ type: ChatWSMessageType.PING });
            }
          }, 15_000);
        },
        onError: (event) => {
          console.error("WebSocket error:", event);
          // Avoid surfacing transient connection errors during retries.
        },
        onClose: (event) => {
          console.log("WebSocket closed:", event.code, event.reason);
          setConnectionStatus("disconnected");
          clientRef.current = null;
          setOnlineCounts(null);
          setTypingUsers({});
          setConnectedUserId(null);
          for (const timeout of typingTimeoutsRef.current.values()) {
            clearTimeout(timeout);
          }
          typingTimeoutsRef.current.clear();
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }

          if (isManualCloseRef.current) {
            return;
          }

          // Check if user was banned (code 1008 with "banned" reason)
          if (event.code === 1008 || event.reason.toLowerCase().includes("banned")) {
            isBannedRef.current = true;
            setConnectionStatus("error");
            setError("Your account has been banned");
            return; // Don't attempt reconnection
          }

          // Auto-reconnect with exponential backoff
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
            reconnectAttemptsRef.current++;

            console.log(
              `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`,
            );

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            setConnectionStatus("error");
            setError("Failed to connect after multiple attempts");
          }
        },
      });

      clientRef.current = newClient;
      const guestId = getGuestId();
      newClient.connect(roomId, guestId || undefined);
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setConnectionStatus("error");
      setError("Failed to create connection");
    }
  }, [roomId, handleMessage]);

  useEffect(() => {
    if (!throttleUntil) {
      setThrottleRemainingMs(null);
      return;
    }

    const updateRemaining = () => {
      const remaining = throttleUntil - Date.now();
      if (remaining <= 0) {
        setThrottleRemainingMs(null);
        setThrottleUntil(null);
        setThrottleRestoreMessage(null);
        return;
      }
      setThrottleRemainingMs(remaining);
    };

    updateRemaining();
    const intervalId = setInterval(updateRemaining, 250);
    return () => clearInterval(intervalId);
  }, [throttleUntil]);

  useEffect(() => {
    if (lastRoomIdRef.current === roomId) {
      return;
    }
    lastRoomIdRef.current = roomId;
    recentMessageTimestampsRef.current = [];
    setThrottleUntil(null);
    setThrottleMeta(null);
    setThrottleRemainingMs(null);
    setThrottleRestoreMessage(null);
    hasAttemptedRef.current = false;
    setOnlineCounts(null);
    setTypingUsers({});
    for (const timeout of typingTimeoutsRef.current.values()) {
      clearTimeout(timeout);
    }
    typingTimeoutsRef.current.clear();
  }, [roomId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (clientRef.current) {
      isManualCloseRef.current = true;
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    setConnectionStatus("disconnected");
    setOnlineCounts(null);
    setTypingUsers({});
    setConnectedUserId(null);
    for (const timeout of typingTimeoutsRef.current.values()) {
      clearTimeout(timeout);
    }
    typingTimeoutsRef.current.clear();
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
      const client = clientRef.current;
      if (!client || !client.isConnected()) {
        setError("Not connected");
        return false;
      }

      if (throttleRemainingMs !== null) {
        return false;
      }

      const now = Date.now();
      const windowStart = now - throttleWindowMs;
      recentMessageTimestampsRef.current = recentMessageTimestampsRef.current.filter(
        (timestamp) => timestamp > windowStart,
      );

      if (recentMessageTimestampsRef.current.length >= throttleRule.maxMessages) {
        const oldest = recentMessageTimestampsRef.current[0];
        const retryAfterMs = Math.max(oldest + throttleWindowMs - now, 0);
        setThrottleMeta({
          limit: throttleRule.maxMessages,
          windowMs: throttleWindowMs,
        });
        setThrottleUntil(now + retryAfterMs);
        return false;
      }

      recentMessageTimestampsRef.current.push(now);
      lastSentMessageRef.current = message;

      const payload: ChatWSMessage = {
        type: ChatWSMessageType.SEND_MESSAGE,
        message: message.trim(),
      };

      return client.send(payload);
    },
    [throttleRemainingMs, throttleRule.maxMessages, throttleWindowMs],
  );

  const sendTypingStatus = useCallback(
    (isTyping: boolean) => {
      const client = clientRef.current;
      if (!client || !client.isConnected()) {
        return;
      }

      const payload: ChatWSMessage = {
        type: ChatWSMessageType.TYPING_STATUS,
        isTyping,
        roomId,
      };

      client.send(payload);
    },
    [roomId],
  );

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (!hasAttemptedRef.current) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    messages,
    sendMessage,
    sendTypingStatus,
    connectionStatus,
    error,
    isAuthenticated,
    profileIncomplete,
    onlineCounts,
    typingUsers,
    connectedUserId,
    throttle:
      throttleRemainingMs !== null && throttleMeta
        ? {
            remainingMs: throttleRemainingMs,
            limit: throttleMeta.limit,
            windowMs: throttleMeta.windowMs,
            restoreMessage: throttleRestoreMessage ?? undefined,
          }
        : null,
  };
};
