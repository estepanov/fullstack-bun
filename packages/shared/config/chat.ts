export const CHAT_CONFIG = {
  EMOJI_ONLY_MAX: 3,
} as const;

export type ChatThrottleRule = {
  maxMessages: number;
  perSeconds: number;
};

export const CHAT_THROTTLE_CONFIG: {
  default: ChatThrottleRule;
  rooms: Record<string, ChatThrottleRule>;
} = {
  default: {
    maxMessages: 4,
    perSeconds: 15,
  },
  rooms: {
    global: {
      maxMessages: 2,
      perSeconds: 30,
    },
  },
};

export const getChatThrottleRule = (roomId?: string | null): ChatThrottleRule =>
  (roomId && CHAT_THROTTLE_CONFIG.rooms[roomId]) || CHAT_THROTTLE_CONFIG.default;

export const MESSAGE_CONFIG = {
  MAX_LENGTH: 400,
  MIN_LENGTH: 1,
  DEFAULT_ROWS: 2,
} as const;
