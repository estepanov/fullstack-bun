import { useCallback, useEffect, useRef, useState } from "react";
import {
	ChatWSMessageType,
	type ChatMessage,
	type ChatWSMessage,
} from "shared/interfaces/chat";
import { getChatThrottleRule } from "shared/config/chat";

export interface UseChatWebSocketReturn {
	messages: ChatMessage[];
	sendMessage: (message: string) => boolean;
	connectionStatus: "connecting" | "connected" | "disconnected" | "error";
	error: string | null;
	isAuthenticated: boolean;
	profileIncomplete: boolean;
	onlineCounts: { guests: number; members: number; admins: number } | null;
	throttle:
		| {
				remainingMs: number;
				limit: number;
				windowMs: number;
				restoreMessage?: string;
		  }
		| null;
}

const WS_URL = `${import.meta.env.VITE_API_BASE_URL.replace(/^http/, "ws")}/chat/ws`;
const MAX_MESSAGES = 100;
const GUEST_ID_KEY = "chat_guest_id";

const getGuestId = (): string | null => {
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
};

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
	const [throttleUntil, setThrottleUntil] = useState<number | null>(null);
	const [throttleMeta, setThrottleMeta] = useState<{
		limit: number;
		windowMs: number;
	} | null>(null);
	const [throttleRemainingMs, setThrottleRemainingMs] = useState<number | null>(
		null,
	);
	const [throttleRestoreMessage, setThrottleRestoreMessage] = useState<
		string | null
	>(null);

	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const reconnectAttemptsRef = useRef(0);
	const hasAttemptedRef = useRef(false);
	const isManualCloseRef = useRef(false);
	const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const isBannedRef = useRef(false);
	const lastSentMessageRef = useRef<string | null>(null);
	const recentMessageTimestampsRef = useRef<number[]>([]);
	const MAX_RECONNECT_ATTEMPTS = 5;
	const throttleRule = getChatThrottleRule(roomId);
	const throttleWindowMs = throttleRule.perSeconds * 1000;

	const connect = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
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
			const wsUrl = new URL(WS_URL);
			if (roomId !== "global") {
				wsUrl.searchParams.set("room", roomId);
			}
			const guestId = getGuestId();
			if (guestId) {
				wsUrl.searchParams.set("guestId", guestId);
			}
			const ws = new WebSocket(wsUrl.toString());
			wsRef.current = ws;

			ws.onopen = () => {
				console.log("WebSocket connected");
				setConnectionStatus("connected");
				reconnectAttemptsRef.current = 0;
				if (heartbeatIntervalRef.current) {
					clearInterval(heartbeatIntervalRef.current);
				}
				heartbeatIntervalRef.current = setInterval(() => {
					if (ws.readyState !== WebSocket.OPEN) {
						return;
					}
					ws.send(JSON.stringify({ type: ChatWSMessageType.PING }));
				}, 15_000);
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as ChatWSMessage;

					switch (data.type) {
						case ChatWSMessageType.CONNECTED:
							setIsAuthenticated(!!data.userId);
							setProfileIncomplete(!!data.profileIncomplete);
							break;
						case ChatWSMessageType.PRESENCE:
							setOnlineCounts(data.data);
							break;

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
							setMessages((prev) =>
								prev.filter((msg) => msg.id !== data.messageId),
							);
							break;

						case ChatWSMessageType.MESSAGE_UPDATED:
							setMessages((prev) =>
								prev.map((msg) => (msg.id === data.data.id ? data.data : msg)),
							);
							break;

						case ChatWSMessageType.BULK_DELETE:
							setMessages((prev) =>
								prev.filter((msg) => msg.userId !== data.userId),
							);
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

						default: {
							// Exhaustive check: if we add a new message type and don't handle it,
							// TypeScript will error here because data.type won't be assignable to never
							const _exhaustiveCheck: never = data;
							console.warn("Unhandled message type:", _exhaustiveCheck);
							break;
						}
					}
				} catch (err) {
					console.error("Failed to parse WebSocket message:", err);
				}
			};

			ws.onerror = (event) => {
				console.error("WebSocket error:", event);
				// Avoid surfacing transient connection errors during retries.
			};

			ws.onclose = (event) => {
				console.log("WebSocket closed:", event.code, event.reason);
				setConnectionStatus("disconnected");
				wsRef.current = null;
				setOnlineCounts(null);
				if (heartbeatIntervalRef.current) {
					clearInterval(heartbeatIntervalRef.current);
					heartbeatIntervalRef.current = null;
				}

				if (isManualCloseRef.current) {
					return;
				}

				// Check if user was banned (code 1008 with "banned" reason)
				if (
					event.code === 1008 ||
					event.reason.toLowerCase().includes("banned")
				) {
					isBannedRef.current = true;
					setConnectionStatus("error");
					setError("Your account has been banned");
					return; // Don't attempt reconnection
				}

				// Auto-reconnect with exponential backoff
				if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
					const delay = Math.min(
						1000 * 2 ** reconnectAttemptsRef.current,
						30000,
					);
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
			};
		} catch (err) {
			console.error("Failed to create WebSocket:", err);
			setConnectionStatus("error");
			setError("Failed to create connection");
		}
	}, [roomId]);

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
		recentMessageTimestampsRef.current = [];
		setThrottleUntil(null);
		setThrottleMeta(null);
		setThrottleRemainingMs(null);
		setThrottleRestoreMessage(null);
		hasAttemptedRef.current = false;
		setOnlineCounts(null);
	}, [roomId]);

	const disconnect = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		if (wsRef.current) {
			isManualCloseRef.current = true;
			wsRef.current.close();
			wsRef.current = null;
		}
		if (heartbeatIntervalRef.current) {
			clearInterval(heartbeatIntervalRef.current);
			heartbeatIntervalRef.current = null;
		}

		setConnectionStatus("disconnected");
		setOnlineCounts(null);
	}, []);

	const sendMessage = useCallback(
		(message: string) => {
			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
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

			const payload = {
				type: ChatWSMessageType.SEND_MESSAGE,
				message: message.trim(),
			};

			wsRef.current.send(JSON.stringify(payload));
			return true;
		},
		[throttleRemainingMs, throttleRule.maxMessages, throttleWindowMs],
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
		connectionStatus,
		error,
		isAuthenticated,
		profileIncomplete,
		onlineCounts,
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
