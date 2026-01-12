import { redis } from "./redis";
import { appLogger } from "../utils/logger";

type ClientRole = "guest" | "member" | "admin";

/**
 * Service for managing presence tracking across multiple API instances using Redis.
 * Uses Redis sorted sets with timestamps as scores to automatically handle stale entries.
 */
export class ChatPresenceService {
	private readonly presenceTimeoutMs = 30_000; // 30 seconds

	/**
	 * Get the Redis key for a specific role's presence set
	 */
	private getPresenceKey(role: ClientRole): string {
		return `chat:presence:global:${role}s`;
	}

	/**
	 * Add a client to the presence tracking
	 */
	async addPresence(presenceId: string, role: ClientRole): Promise<void> {
		try {
			const now = Date.now();
			const key = this.getPresenceKey(role);
			await redis.zadd(key, now, presenceId);
			// Set expiration on the key itself (2 minutes, 2x presence timeout)
			await redis.expire(key, 120);
		} catch (error) {
			appLogger.error(
				{ error, presenceId, role },
				"Failed to add presence:",
			);
		}
	}

	/**
	 * Remove a client from presence tracking
	 */
	async removePresence(presenceId: string, role: ClientRole): Promise<void> {
		try {
			const key = this.getPresenceKey(role);
			await redis.zrem(key, presenceId);
		} catch (error) {
			appLogger.error(
				{ error, presenceId, role },
				"Failed to remove presence:",
			);
		}
	}

	/**
	 * Update the timestamp for a client (keep-alive)
	 */
	async touchPresence(presenceId: string, role: ClientRole): Promise<void> {
		try {
			const now = Date.now();
			const key = this.getPresenceKey(role);
			// Update the score (timestamp) for this presenceId
			await redis.zadd(key, now, presenceId);
		} catch (error) {
			appLogger.error(
				{ error, presenceId, role },
				"Failed to touch presence:",
			);
		}
	}

	/**
	 * Remove stale presence entries across all role sets
	 * Entries older than presenceTimeoutMs are considered stale
	 */
	async pruneStalePresence(): Promise<void> {
		try {
			const cutoff = Date.now() - this.presenceTimeoutMs;
			const roles: ClientRole[] = ["guest", "member", "admin"];

			for (const role of roles) {
				const key = this.getPresenceKey(role);
				const removed = await redis.zremrangebyscore(key, 0, cutoff);
				if (removed > 0) {
					appLogger.debug(
						{ role, removed },
						`Pruned ${removed} stale ${role} presence entries`,
					);
				}
			}
		} catch (error) {
			appLogger.error({ error }, "Failed to prune stale presence:");
		}
	}

	/**
	 * Get the current presence counts across all instances
	 * Automatically prunes stale entries first to ensure accurate counts
	 */
	async getPresenceCounts(): Promise<{
		guests: number;
		members: number;
		admins: number;
	}> {
		try {
			// Prune stale entries first for accuracy
			await this.pruneStalePresence();

			// Get counts from all role sets
			const [guests, members, admins] = await Promise.all([
				redis.zcard(this.getPresenceKey("guest")),
				redis.zcard(this.getPresenceKey("member")),
				redis.zcard(this.getPresenceKey("admin")),
			]);

			return {
				guests,
				members,
				admins,
			};
		} catch (error) {
			appLogger.error({ error }, "Failed to get presence counts:");
			// Return zeros on error to avoid breaking the application
			return { guests: 0, members: 0, admins: 0 };
		}
	}

	/**
	 * Clear all presence data (useful for testing or manual cleanup)
	 */
	async clearAll(): Promise<void> {
		try {
			const roles: ClientRole[] = ["guest", "member", "admin"];
			await Promise.all(
				roles.map((role) => redis.del(this.getPresenceKey(role))),
			);
			appLogger.info("Cleared all presence data");
		} catch (error) {
			appLogger.error({ error }, "Failed to clear presence data:");
		}
	}
}

// Export singleton instance
export const chatPresenceService = new ChatPresenceService();
