/**
 * Notification system configuration
 * Defines default settings, delivery strategies, and notification type defaults
 */

/**
 * Default notification system settings
 */
export const NOTIFICATION_CONFIG = {
  /**
   * Maximum number of notifications to keep in memory on the frontend
   */
  maxInMemoryNotifications: 50,

  /**
   * Redis cache TTL for unread counts (in seconds)
   */
  unreadCountCacheTTL: 300, // 5 minutes

  /**
   * SSE (Server-Sent Events) settings
   */
  sseKeepAliveInterval: 15000, // 15 seconds - server keep-alive interval
  ssePresenceTimeout: 45000, // 45 seconds - client timeout (3x keep-alive)
  ssePruneInterval: 10000, // 10 seconds - pruning interval for stale clients

  /**
   * Optional client heartbeat via REST (in milliseconds)
   * Set to 0 to disable client heartbeat
   */
  clientHeartbeatInterval: 30000, // 30 seconds

  /**
   * Toast notification duration (in milliseconds)
   */
  toastDuration: 5000,

  /**
   * Default pagination settings for notification lists
   */
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

/**
 * Notification types that trigger email delivery by default for offline users
 */
export const DEFAULT_EMAIL_TYPES = [
  "friend_request",
  "mention",
  "announcement",
  "warning",
] as const;

/**
 * Notification types that trigger push delivery by default for offline users
 */
export const DEFAULT_PUSH_TYPES = ["message", "friend_request", "mention"] as const;

/**
 * Delivery strategy priority order
 * Strategies are attempted in this order until one succeeds
 */
export const DELIVERY_STRATEGY_PRIORITY = [
  "sse",
  "email",
  // "push"
] as const;

/**
 * Notification retention settings
 */
export const NOTIFICATION_RETENTION = {
  /**
   * Maximum age of notifications to keep (in days)
   * Older notifications may be archived or deleted
   */
  maxAgeInDays: 90,

  /**
   * Maximum number of notifications to keep per user
   * Oldest notifications are deleted when this limit is exceeded
   */
  maxNotificationsPerUser: 1000,
} as const;

const getFrontendHostFromEnv = () => {
  if (typeof process === "undefined") {
    return undefined;
  }

  const { FE_BASE_URL, FRONTEND_URL } = process.env;
  const baseUrl = FE_BASE_URL ?? FRONTEND_URL;
  if (!baseUrl) {
    return undefined;
  }

  try {
    return new URL(baseUrl).hostname;
  } catch {
    return undefined;
  }
};

/**
 * Hosts that are trusted targets for notification actions.
 * Update this list whenever you add a new domain that notifications are allowed to link to.
 */
export const NOTIFICATION_ACTION_ALLOWED_DOMAINS = [
  getFrontendHostFromEnv(),
  "fullstackbun.dev",
  "frontend.demo.fullstackbun.dev",
  "admin.demo.fullstackbun.dev",
].filter((value): value is string => Boolean(value));
