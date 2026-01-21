import { RedisStore } from "rate-limit-redis";
import type { Store } from "hono-rate-limiter";
import type Redis from "ioredis";

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
    // @ts-expect-error - adapter pattern for ioredis
    // RedisStore expects Upstash Redis sendCommand, but we're adapting ioredis
    // The sendCommand method is mapped to ioredis client.call()
    sendCommand: async (...args: [string, ...string[]]) => {
      return client.call(...args);
    },
    prefix,
  });

  return store as unknown as Store;
};
