import type { WSContext } from "hono/ws";
import type { ChatMessage } from "shared/interfaces/chat";
import { ChatWSMessageType } from "shared/interfaces/chat";

interface ConnectedClient {
	ws: WSContext;
	userId: string | null;
	userName: string | null;
}

class ChatManager {
	private clients: Set<ConnectedClient> = new Set();

	addClient(client: ConnectedClient) {
		this.clients.add(client);
		console.log(`Chat client connected. Total clients: ${this.clients.size}`);
	}

	removeClient(client: ConnectedClient) {
		this.clients.delete(client);
		console.log(
			`Chat client disconnected. Total clients: ${this.clients.size}`,
		);
	}

	broadcast(message: ChatMessage | { type: string; userId: string; deletedCount: number }) {
		const payload =
			"id" in message
				? {
						type: ChatWSMessageType.NEW_MESSAGE,
						data: message,
					}
				: message;

		const messageStr = JSON.stringify(payload);
		let sent = 0;
		let failed = 0;

		for (const client of this.clients) {
			try {
				client.ws.send(messageStr);
				sent++;
			} catch (error) {
				console.error("Failed to send to client:", error);
				failed++;
			}
		}

		console.log(`Broadcast message: sent=${sent}, failed=${failed}`);
	}

	broadcastDeletion(messageId: string) {
		const payload = {
			type: ChatWSMessageType.MESSAGE_DELETED,
			messageId,
		};

		const messageStr = JSON.stringify(payload);
		let sent = 0;
		let failed = 0;

		for (const client of this.clients) {
			try {
				client.ws.send(messageStr);
				sent++;
			} catch (error) {
				console.error("Failed to send deletion to client:", error);
				failed++;
			}
		}

		console.log(`Broadcast deletion: sent=${sent}, failed=${failed}`);
	}

	broadcastUpdate(message: ChatMessage) {
		const payload = {
			type: ChatWSMessageType.MESSAGE_UPDATED,
			data: message,
		};

		const messageStr = JSON.stringify(payload);
		let sent = 0;
		let failed = 0;

		for (const client of this.clients) {
			try {
				client.ws.send(messageStr);
				sent++;
			} catch (error) {
				console.error("Failed to send update to client:", error);
				failed++;
			}
		}

		console.log(`Broadcast update: sent=${sent}, failed=${failed}`);
	}

	disconnectUser(userId: string) {
		let disconnected = 0;

		for (const client of this.clients) {
			if (client.userId === userId) {
				try {
					client.ws.close(1008, "User has been banned");
					this.clients.delete(client);
					disconnected++;
				} catch (error) {
					console.error("Failed to disconnect client:", error);
				}
			}
		}

		console.log(`Disconnected ${disconnected} connections for user ${userId}`);
	}

	getClientCount(): number {
		return this.clients.size;
	}
}

// Singleton instance
export const chatManager = new ChatManager();
