import type { WSContext } from "hono/ws";
import type { ChatMessage } from "shared/interfaces/chat";
import { ChatWSMessageType } from "shared/interfaces/chat";

type ClientRole = "guest" | "member" | "admin";

interface ConnectedClient {
	ws: WSContext;
	userId: string | null;
	userName: string | null;
	role: ClientRole;
	presenceId: string;
	lastSeenAt: number;
}

class ChatManager {
	private clients: Map<WSContext, ConnectedClient> = new Map();
	private pruneIntervalId: ReturnType<typeof setInterval> | null = null;
	private readonly presenceTimeoutMs = 30_000;
	private readonly pruneIntervalMs = 10_000;

	addClient(client: Omit<ConnectedClient, "lastSeenAt">) {
		const stampedClient = {
			...client,
			lastSeenAt: Date.now(),
		};
		this.clients.set(client.ws, stampedClient);
		if (!this.pruneIntervalId) {
			this.pruneIntervalId = setInterval(
				() => this.pruneStaleClients(),
				this.pruneIntervalMs,
			);
		}
		console.log(`Chat client connected. Total clients: ${this.clients.size}`);
		this.broadcastPresence();
	}

	removeClient(client: Omit<ConnectedClient, "lastSeenAt">) {
		this.clients.delete(client.ws);
		console.log(
			`Chat client disconnected. Total clients: ${this.clients.size}`,
		);
		this.broadcastPresence();
	}

	touchClient(ws: WSContext) {
		const client = this.clients.get(ws);
		if (!client) {
			return;
		}
		client.lastSeenAt = Date.now();
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

		for (const client of this.clients.values()) {
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

		for (const client of this.clients.values()) {
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

		for (const client of this.clients.values()) {
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

		for (const [ws, client] of this.clients) {
			if (client.userId === userId) {
				try {
					client.ws.close(1008, "User has been banned");
					this.clients.delete(ws);
					disconnected++;
				} catch (error) {
					console.error("Failed to disconnect client:", error);
				}
			}
		}

		console.log(`Disconnected ${disconnected} connections for user ${userId}`);
		if (disconnected > 0) {
			this.broadcastPresence();
		}
	}

	getClientCount(): number {
		return this.clients.size;
	}

	private getPresenceCounts() {
		const guests = new Set<string>();
		const members = new Set<string>();
		const admins = new Set<string>();

		for (const client of this.clients.values()) {
			switch (client.role) {
				case "guest":
					guests.add(client.presenceId);
					break;
				case "admin":
					admins.add(client.presenceId);
					break;
				default:
					members.add(client.presenceId);
			}
		}

		return {
			guests: guests.size,
			members: members.size,
			admins: admins.size,
		};
	}

	private broadcastPresence() {
		const payload = {
			type: ChatWSMessageType.PRESENCE,
			data: this.getPresenceCounts(),
		};
		const messageStr = JSON.stringify(payload);

		for (const client of this.clients.values()) {
			try {
				client.ws.send(messageStr);
			} catch (error) {
				console.error("Failed to send presence update to client:", error);
			}
		}
	}

	private pruneStaleClients() {
		if (this.clients.size === 0) {
			if (this.pruneIntervalId) {
				clearInterval(this.pruneIntervalId);
				this.pruneIntervalId = null;
			}
			return;
		}

		const now = Date.now();
		let removed = 0;

		for (const [ws, client] of this.clients) {
			if (now - client.lastSeenAt <= this.presenceTimeoutMs) {
				continue;
			}
			try {
				ws.close(1001, "Presence timeout");
			} catch (error) {
				console.error("Failed to close stale client:", error);
			}
			this.clients.delete(ws);
			removed++;
		}

		if (removed > 0) {
			this.broadcastPresence();
		}
	}
}

// Singleton instance
export const chatManager = new ChatManager();
