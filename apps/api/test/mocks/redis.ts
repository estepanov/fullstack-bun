import { mock } from "bun:test";

type ZEntry = { score: number; value: string };

export const redisStore = new Map<string, ZEntry[]>();

// Additional key-value store for string values (separate from sorted sets)
export const keyValueStore = new Map<string, string>();

// Store for loaded Lua scripts (SHA hash -> script content)
const loadedScripts = new Map<string, string>();

// Helper to clear all Redis stores
export const clearRedisStores = () => {
  redisStore.clear();
  keyValueStore.clear();
  loadedScripts.clear();
};

const getSet = (key: string) => {
  const existing = redisStore.get(key);
  if (existing) {
    return existing;
  }
  const next: ZEntry[] = [];
  redisStore.set(key, next);
  return next;
};

const resolveRange = (size: number, start: number, stop: number) => {
  if (size === 0) {
    return [1, 0] as const;
  }

  const normalize = (value: number) => (value < 0 ? size + value : value);
  let resolvedStart = normalize(start);
  let resolvedStop = normalize(stop);

  if (resolvedStop < 0) {
    return [1, 0] as const;
  }

  if (resolvedStart < 0) {
    resolvedStart = 0;
  }

  resolvedStart = Math.min(resolvedStart, size - 1);
  resolvedStop = Math.min(resolvedStop, size - 1);

  if (resolvedStart > resolvedStop) {
    return [1, 0] as const;
  }

  return [resolvedStart, resolvedStop] as const;
};

export const redisMock = {
  zadd: async (key: string, score: number, value: string) => {
    const set = getSet(key);
    set.push({ score, value });
    set.sort((a, b) => a.score - b.score);
    return 1;
  },
  zrange: async (key: string, start: number, stop: number) => {
    const set = getSet(key);
    const [from, to] = resolveRange(set.length, start, stop);
    return set.slice(from, to + 1).map((entry) => entry.value);
  },
  zrevrange: async (key: string, start: number, stop: number) => {
    const set = getSet(key);
    const reversed = [...set].sort((a, b) => b.score - a.score);
    const [from, to] = resolveRange(reversed.length, start, stop);
    return reversed.slice(from, to + 1).map((entry) => entry.value);
  },
  zremrangebyrank: async (key: string, start: number, stop: number) => {
    const set = getSet(key);
    const [from, to] = resolveRange(set.length, start, stop);
    const removed = set.splice(from, to - from + 1);
    return removed.length;
  },
  zrem: async (key: string, value: string) => {
    const set = getSet(key);
    const index = set.findIndex((entry) => entry.value === value);
    if (index === -1) {
      return 0;
    }
    set.splice(index, 1);
    return 1;
  },
  del: async (key: string) => {
    keyValueStore.delete(key);
    return redisStore.delete(key) ? 1 : 0;
  },
  get: async (key: string) => {
    return keyValueStore.get(key) ?? null;
  },
  set: async (key: string, value: string) => {
    keyValueStore.set(key, value);
    return "OK";
  },
  setex: async (key: string, _ttl: number, value: string) => {
    keyValueStore.set(key, value);
    // In real Redis, TTL would cause expiration, but we'll ignore it in tests
    return "OK";
  },
  eval: async () => [1, 0, 0],
  ping: async () => "PONG",
  quit: async () => "OK",
  // Generic call method for executing Redis commands
  // Used by rate-limit-redis adapter
  call: mock(async (command: string, ...args: string[]) => {
    const cmd = command.toLowerCase();

    switch (cmd) {
      case "get":
        return keyValueStore.get(args[0]) ?? null;
      case "set":
        keyValueStore.set(args[0], args[1]);
        return "OK";
      case "setex":
        // args: [key, ttl, value]
        keyValueStore.set(args[0], args[2]);
        return "OK";
      case "del":
        keyValueStore.delete(args[0]);
        redisStore.delete(args[0]);
        return 1;
      case "incr":
        {
          const current = Number.parseInt(keyValueStore.get(args[0]) ?? "0", 10);
          const next = current + 1;
          keyValueStore.set(args[0], String(next));
          return next;
        }
      case "expire":
        // In tests, we ignore expiration
        return 1;
      case "ttl":
        // Return a default TTL in tests
        return 60;
      case "ping":
        return "PONG";
      case "script":
        // Handle SCRIPT LOAD command
        {
          const subcommand = args[0]?.toLowerCase();
          if (subcommand === "load") {
            const script = args[1];
            // Generate a simple SHA hash (in real Redis this would be SHA1)
            // For tests, we can just use a simple hash based on the script length
            const sha = `sha${script.length}`;
            loadedScripts.set(sha, script);
            return sha;
          }
          return "OK";
        }
      case "evalsha":
        // Execute a previously loaded script
        // args: [sha, numKeys, ...keys, ...argv]
        {
          const sha = args[0];
          const numKeys = Number.parseInt(args[1], 10);
          const key = args[2]; // First KEYS[1]
          const resetOnChange = args[3]; // ARGV[1]
          const windowMs = Number.parseInt(args[4], 10); // ARGV[2]

          // Get current value and check if it exists
          const current = keyValueStore.get(key);

          if (!current) {
            // New key: set to 1 and return full window time
            keyValueStore.set(key, "1");
            return [1, windowMs];
          }

          // Increment counter
          const totalHits = Number.parseInt(current, 10) + 1;
          keyValueStore.set(key, String(totalHits));

          // Return remaining time in window (in tests, we'll just return the full window)
          const timeToExpire = windowMs;

          // Return in the format rate-limit-redis expects: [totalHits, timeToExpire]
          return [totalHits, timeToExpire];
        }
      case "eval":
        // rate-limit-redis uses a Lua script that increments a counter and sets expiration
        // The script returns [totalHits, timeToExpire]
        // args: [script, numKeys, key, resetOnChange, windowMs]
        {
          const numKeys = Number.parseInt(args[1], 10);
          const key = args[2]; // The rate limit key
          const resetOnChange = args[3] === "1";
          const windowMs = Number.parseInt(args[4], 10); // Window in milliseconds

          // Get current value and check if it exists
          const current = keyValueStore.get(key);

          if (!current) {
            // New key: set to 1 and return full window time
            keyValueStore.set(key, "1");
            return [1, windowMs];
          }

          // Increment counter
          const totalHits = Number.parseInt(current, 10) + 1;
          keyValueStore.set(key, String(totalHits));

          // Return remaining time in window (in tests, we'll just return the full window)
          const timeToExpire = windowMs;

          // Return in the format rate-limit-redis expects: [totalHits, timeToExpire]
          return [totalHits, timeToExpire];
        }
      default:
        // Default response for unknown commands
        return "OK";
    }
  }),
};

const redisModulePath = import.meta.resolve("../../src/lib/redis.ts");

mock.module(redisModulePath, () => ({
  redis: redisMock,
  getRedisClient: () => redisMock,
  isRedisReady: async () => true,
  getRedisPubSubPublisher: () => redisMock,
  getRedisPubSubSubscriber: () => redisMock,
}));
