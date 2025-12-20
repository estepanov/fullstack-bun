import { v4 as uuidv4 } from "uuid";
import type { ChatMessage } from "shared/interfaces/chat";
import { redis } from "./redis";

const CHAT_KEY = "chat:global:messages";
const MAX_MESSAGES = 100;

export class ChatService {
	private async findMessageEntry(messageId: string): Promise<{
		message: ChatMessage;
		raw: string;
	} | null> {
		const messages = await redis.zrange(CHAT_KEY, 0, -1);

		for (const msgStr of messages) {
			try {
				const msg = JSON.parse(msgStr) as ChatMessage;
				if (msg.id === messageId) {
					return { message: msg, raw: msgStr };
				}
			} catch (error) {
				console.error("Failed to parse message:", error);
			}
		}

		return null;
	}

	async getMessageById(messageId: string): Promise<ChatMessage | null> {
		const entry = await this.findMessageEntry(messageId);
		return entry?.message ?? null;
	}

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
	 * Delete a specific message by ID
	 */
	async deleteMessage(messageId: string): Promise<ChatMessage | null> {
		try {
			const entry = await this.findMessageEntry(messageId);
			if (!entry) {
				return null;
			}

			const removed = await redis.zrem(CHAT_KEY, entry.raw);
			return removed > 0 ? entry.message : null;
		} catch (error) {
			console.error("Failed to delete message:", error);
			return null;
		}
	}

	/**
	 * Update a specific message by ID
	 */
	async updateMessage(
		messageId: string,
		newMessage: string,
	): Promise<ChatMessage | null> {
		try {
			const entry = await this.findMessageEntry(messageId);
			if (!entry) {
				return null;
			}

			const score = Number.isFinite(entry.message.timestamp)
				? entry.message.timestamp
				: Date.now();
			const updated: ChatMessage = {
				...entry.message,
				message: newMessage.trim(),
				editedAt: new Date().toISOString(),
			};

			const removed = await redis.zrem(CHAT_KEY, entry.raw);
			if (!removed) {
				return null;
			}

			await redis.zadd(CHAT_KEY, score, JSON.stringify(updated));
			return updated;
		} catch (error) {
			console.error("Failed to update message:", error);
			return null;
		}
	}

	/**
	 * Delete all messages from a specific user (admin only)
	 */
	async deleteMessagesByUserId(userId: string): Promise<number> {
		try {
			// Get all messages
			const messages = await redis.zrange(CHAT_KEY, 0, -1);
			let deletedCount = 0;

			// Find and delete all messages from this user
			for (const msgStr of messages) {
				try {
					const msg = JSON.parse(msgStr) as ChatMessage;
					if (msg.userId === userId) {
						const removed = await redis.zrem(CHAT_KEY, msgStr);
						if (removed > 0) {
							deletedCount++;
						}
					}
				} catch (error) {
					console.error("Failed to parse message during bulk deletion:", error);
				}
			}

			return deletedCount;
		} catch (error) {
			console.error("Failed to delete messages by user ID:", error);
			return 0;
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
