import { v4 as uuidv4 } from "uuid";
import type { ChatMessage } from "shared/interfaces/chat";
import { redis } from "./redis";

const CHAT_KEY = "chat:global:messages";
const MAX_MESSAGES = 100;

export class ChatService {
	/**
	 * Add a new message to Redis and return it
	 */
	async addMessage({
		userId,
		userName,
		userAvatar,
		message,
	}: {
		userId: string;
		userName: string;
		userAvatar: string | null;
		message: string;
	}): Promise<ChatMessage> {
		const timestamp = Date.now();
		const chatMessage: ChatMessage = {
			id: uuidv4(),
			userId,
			userName,
			userAvatar,
			message: message.trim(),
			timestamp,
			createdAt: new Date(timestamp).toISOString(),
		};

		// Add to sorted set (score = timestamp)
		await redis.zadd(CHAT_KEY, timestamp, JSON.stringify(chatMessage));

		// Trim to keep only last MAX_MESSAGES
		await redis.zremrangebyrank(CHAT_KEY, 0, -(MAX_MESSAGES + 1));

		return chatMessage;
	}

	/**
	 * Get message history (last N messages, oldest first)
	 */
	async getMessageHistory(
		limit: number = MAX_MESSAGES,
	): Promise<ChatMessage[]> {
		// Get last N messages (newest first)
		const messages = await redis.zrevrange(CHAT_KEY, 0, limit - 1);

		// Parse and reverse to get oldest first
		const parsed = messages
			.map((msg) => {
				try {
					return JSON.parse(msg) as ChatMessage;
				} catch (error) {
					console.error("Failed to parse message:", error);
					return null;
				}
			})
			.filter((msg): msg is ChatMessage => msg !== null);

		return parsed.reverse();
	}

	/**
	 * Delete a specific message by ID (admin only)
	 */
	async deleteMessage(messageId: string): Promise<boolean> {
		try {
			// Get all messages
			const messages = await redis.zrange(CHAT_KEY, 0, -1);

			// Find the message with the matching ID
			for (const msgStr of messages) {
				try {
					const msg = JSON.parse(msgStr) as ChatMessage;
					if (msg.id === messageId) {
						// Remove this specific message
						const removed = await redis.zrem(CHAT_KEY, msgStr);
						return removed > 0;
					}
				} catch (error) {
					console.error("Failed to parse message during deletion:", error);
				}
			}

			return false;
		} catch (error) {
			console.error("Failed to delete message:", error);
			return false;
		}
	}

	/**
	 * Clear all messages (admin utility)
	 */
	async clearMessages(): Promise<void> {
		await redis.del(CHAT_KEY);
	}
}

export const chatService = new ChatService();
