import Redis from "ioredis";
import { env } from "../env";

// Singleton pattern for Redis client
let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
	if (!redisClient) {
		redisClient = new Redis(env.REDIS_URL, {
			maxRetriesPerRequest: 3,
			enableReadyCheck: true,
			lazyConnect: false,
			retryStrategy(times) {
				const delay = Math.min(times * 50, 2000);
				return delay;
			},
			reconnectOnError(err) {
				const targetErrors = ["READONLY", "ECONNRESET"];
				return targetErrors.some((targetError) =>
					err.message.includes(targetError),
				);
			},
		});

		redisClient.on("error", (err) => {
			console.error("Redis Client Error:", err);
		});

		redisClient.on("connect", () => {
			console.log("Redis Client Connected");
		});

		redisClient.on("ready", () => {
			console.log("Redis Client Ready");
		});

		redisClient.on("close", () => {
			console.log("Redis Client Closed");
		});
	}

	return redisClient;
};

/**
 * Check if Redis is ready and connected
 */
export const isRedisReady = async (): Promise<boolean> => {
	try {
		const client = getRedisClient();
		const result = await client.ping();
		return result === "PONG";
	} catch (error) {
		console.error("Redis health check failed:", error);
		return false;
	}
};

// Export singleton instance
export const redis = getRedisClient();
