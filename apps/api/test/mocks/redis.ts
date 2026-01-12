import { mock } from "bun:test";

type ZEntry = { score: number; value: string };

export const redisStore = new Map<string, ZEntry[]>();

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
    return redisStore.delete(key) ? 1 : 0;
  },
  eval: async () => [1, 0, 0],
  ping: async () => "PONG",
  quit: async () => "OK",
};

const redisModulePath = import.meta.resolve("../../src/lib/redis.ts");

mock.module(redisModulePath, () => ({
  redis: redisMock,
  getRedisClient: () => redisMock,
  isRedisReady: async () => true,
  getRedisPubSubPublisher: () => redisMock,
  getRedisPubSubSubscriber: () => redisMock,
}));
