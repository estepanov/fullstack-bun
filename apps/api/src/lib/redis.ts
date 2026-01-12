import Redis from "ioredis";
import { env } from "../env";
import { appLogger } from "../utils/logger";

/**
 * Factory function to create a new Redis client with standard configuration
 */
export const createRedisClient = (name = "Redis"): Redis => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError(err) {
      const targetErrors = ["READONLY", "ECONNRESET"];
      return targetErrors.some((targetError) => err.message.includes(targetError));
    },
  });

  client.on("error", (err) => {
    appLogger.error({ err, clientName: name }, `${name} Client Error:`);
  });

  client.on("connect", () => {
    appLogger.info({ clientName: name }, `${name} Client Connected`);
  });

  client.on("ready", () => {
    appLogger.info({ clientName: name }, `${name} Client Ready`);
  });

  client.on("close", () => {
    appLogger.info({ clientName: name }, `${name} Client Closed`);
  });

  return client;
};

// Singleton pattern for main Redis client
let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = createRedisClient("Redis");
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
    appLogger.error({ error }, "Redis health check failed:");
    return false;
  }
};

// Export singleton instance for backwards compatibility
export const redis = getRedisClient();

/**
 * Separate Redis clients for pub/sub operations
 * Pub/sub requires dedicated connections to avoid blocking
 * These are initialized lazily by ChatPubSubManager
 */
let pubSubPublisher: Redis | null = null;
let pubSubSubscriber: Redis | null = null;

export const getRedisPubSubPublisher = (): Redis => {
  if (!pubSubPublisher) {
    pubSubPublisher = createRedisClient("Redis PubSub Publisher");
  }
  return pubSubPublisher;
};

export const getRedisPubSubSubscriber = (): Redis => {
  if (!pubSubSubscriber) {
    pubSubSubscriber = createRedisClient("Redis PubSub Subscriber");
  }
  return pubSubSubscriber;
};
