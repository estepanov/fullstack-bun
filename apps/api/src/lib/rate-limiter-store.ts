import type { Store } from "hono-rate-limiter";
import type Redis from "ioredis";
import { RedisStore, type RedisReply } from "rate-limit-redis";

/**
 * Creates a Redis store adapter for hono-rate-limiter
 *
 * Bridges the gap between ioredis and hono-rate-limiter which expects Upstash Redis.
 * Uses the rate-limit-redis package as an adapter via sendCommand → client.call() mapping.
 *
 * @param client - ioredis client instance
 * @param prefix - Key prefix for rate limit entries (default: "rate-limit:")
 * @returns Store compatible with hono-rate-limiter
 *
 * @example
 * ```typescript
 * import { createRedisRateLimitStore } from "./rate-limiter-store";
 * import { redis } from "./redis";
 *
 * const store = createRedisRateLimitStore(redis, "rate-limit:");
 * ```
 */
export const createRedisRateLimitStore = (
  client: Redis,
  prefix = "rate-limit:",
): Store => {
  const store = new RedisStore({
    sendCommand: async (command: string, ...args: string[]): Promise<RedisReply> => {
      return (await client.call(command, ...args)) as RedisReply;
    },
    prefix,
  });

  return store as unknown as Store;
};
