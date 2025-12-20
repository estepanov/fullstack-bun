import { getChatThrottleRule } from "shared/config/chat";
import { redis } from "./redis";

const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

redis.call("ZREMRANGEBYSCORE", key, 0, now - windowMs)
local current = redis.call("ZCARD", key)

if current >= limit then
  local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
  local oldestTs = tonumber(oldest[2]) or now
  local retryAfter = (oldestTs + windowMs) - now
  if retryAfter < 0 then retryAfter = 0 end
  return {0, retryAfter, current}
end

local seqKey = key .. ":seq"
local seq = redis.call("INCR", seqKey)
redis.call("PEXPIRE", seqKey, windowMs)
redis.call("ZADD", key, now, tostring(seq))
redis.call("PEXPIRE", key, windowMs)
return {1, 0, current + 1}
`;

export type ChatThrottleResult = {
  allowed: boolean;
  retryAfterMs: number;
  limit: number;
  windowMs: number;
};

export const checkChatThrottle = async ({
  userId,
  roomId,
}: {
  userId: string;
  roomId: string;
}): Promise<ChatThrottleResult> => {
  const rule = getChatThrottleRule(roomId);
  const windowMs = rule.perSeconds * 1000;
  const key = `chat:rate:${roomId}:${userId}`;
  const now = Date.now();

  const result = (await redis.eval(
    RATE_LIMIT_SCRIPT,
    1,
    key,
    now,
    windowMs,
    rule.maxMessages,
  )) as [number, number, number];

  return {
    allowed: result[0] === 1,
    retryAfterMs: Number(result[1]),
    limit: rule.maxMessages,
    windowMs,
  };
};
