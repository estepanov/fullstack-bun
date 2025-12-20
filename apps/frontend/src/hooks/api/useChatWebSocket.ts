import { useCallback, useEffect, useRef, useState } from "react";
import {
	ChatWSMessageType,
	type ChatMessage,
	type ChatWSMessage,
} from "shared/interfaces/chat";

interface UseChatWebSocketReturn {
	messages: ChatMessage[];
	sendMessage: (message: string) => void;
	connectionStatus: "connecting" | "connected" | "disconnected" | "error";
	error: string | null;
	isAuthenticated: boolean;
}

const WS_URL = `${import.meta.env.VITE_API_BASE_URL.replace(/^http/, "ws")}/chat/ws`;
const MAX_MESSAGES = 100;

export const useChatWebSocket = (): UseChatWebSocketReturn => {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "disconnected" | "error"
	>("connecting");
	const [error, setError] = useState<string | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttemptsRef = useRef(0);
	const hasAttemptedRef = useRef(false);
	const isBannedRef = useRef(false);
	const MAX_RECONNECT_ATTEMPTS = 5;

	const connect = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			return;
		}

		// Don't reconnect if user is banned
		if (isBannedRef.current) {
			return;
		}

		hasAttemptedRef.current = true;
		setConnectionStatus("connecting");
		setError(null);

		try {
			const ws = new WebSocket(WS_URL);
			wsRef.current = ws;

			ws.onopen = () => {
				console.log("WebSocket connected");
				setConnectionStatus("connected");
				reconnectAttemptsRef.current = 0;
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as ChatWSMessage;

					switch (data.type) {
						case ChatWSMessageType.CONNECTED:
							setIsAuthenticated(!!data.userId);
							break;

						case ChatWSMessageType.MESSAGE_HISTORY:
							setMessages(data.data);
							break;

						case ChatWSMessageType.NEW_MESSAGE:
							setMessages((prev) => {
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

						case ChatWSMessageType.SEND_MESSAGE:
							// Client-to-server message type, should not be received
							console.warn("Received unexpected SEND_MESSAGE from server");
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
	}, []);

	const disconnect = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		setConnectionStatus("disconnected");
	}, []);

	const sendMessage = useCallback((message: string) => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			setError("Not connected");
			return;
		}

		const payload = {
			type: ChatWSMessageType.SEND_MESSAGE,
			message: message.trim(),
		};

		wsRef.current.send(JSON.stringify(payload));
	}, []);

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
	};
};
