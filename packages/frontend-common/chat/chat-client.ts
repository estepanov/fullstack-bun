import type { ChatWSMessage } from "shared/interfaces/chat";
import { SessionStore } from "../auth/session-utils";

export interface ChatClientConfig {
  baseURL: string;
  onMessage?: (message: ChatWSMessage) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

export interface ChatClient {
  connect: (roomId?: string, guestId?: string) => void;
  disconnect: () => void;
  send: (message: ChatWSMessage) => boolean;
  isConnected: () => boolean;
  getReadyState: () => number;
  getWebSocket: () => WebSocket | null;
}

const GUEST_ID_KEY = "chat_guest_id";

export function getGuestId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = window.localStorage.getItem(GUEST_ID_KEY);
  if (existing) {
    return existing;
  }

  const fallbackId = `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const newId = window.crypto?.randomUUID?.() ?? fallbackId;
  window.localStorage.setItem(GUEST_ID_KEY, newId);
  return newId;
}

export function createChatClientInstance(config: ChatClientConfig): ChatClient {
  const wsUrl = config.baseURL.replace(/^http/, "ws");
  const sessionStore = new SessionStore();

  let ws: WebSocket | null = null;

  const connect = (roomId = "global", guestId?: string) => {
    if (ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const url = new URL(`${wsUrl}/chat/ws`);

      if (roomId !== "global") {
        url.searchParams.set("room", roomId);
      }

      const finalGuestId = guestId || getGuestId();
      if (finalGuestId) {
        url.searchParams.set("guestId", finalGuestId);
      }

      // Add session tracking headers as query params for WebSocket
      url.searchParams.set("sessionId", sessionStore.getSessionId());
      url.searchParams.set("requestId", crypto.randomUUID());

      ws = new WebSocket(url.toString());

      ws.onopen = () => {
        console.log("WebSocket connected");
        config.onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ChatWSMessage;
          config.onMessage?.(data);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        config.onError?.(event);
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        config.onClose?.(event);
        ws = null;
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      throw err;
    }
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
  };

  const send = (message: ChatWSMessage): boolean => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected");
      return false;
    }

    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error("Failed to send WebSocket message:", err);
      return false;
    }
  };

  const isConnected = (): boolean => {
    return ws?.readyState === WebSocket.OPEN;
  };

  const getReadyState = (): number => {
    return ws?.readyState ?? WebSocket.CLOSED;
  };

  const getWebSocket = (): WebSocket | null => {
    return ws;
  };

  return {
    connect,
    disconnect,
    send,
    isConnected,
    getReadyState,
    getWebSocket,
  };
}
