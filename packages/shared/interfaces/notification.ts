import { z } from "zod";

/**
 * Notification types
 */
export enum NotificationType {
  SYSTEM = "system",
  MESSAGE = "message",
  FRIEND_REQUEST = "friend_request",
  MENTION = "mention",
  ANNOUNCEMENT = "announcement",
  WARNING = "warning",
  SUCCESS = "success",
  INFO = "info",
}

/**
 * Notification action types
 */
export enum NotificationActionType {
  LINK = "link",
}

/**
 * Button variants for notification actions
 */
export const notificationActionVariantSchema = z.enum([
  "default",
  "destructive",
  "outline",
  "secondary",
  "ghost",
  "link",
]);
export type NotificationActionVariant = z.infer<typeof notificationActionVariantSchema>;

export const notificationActionSchema = z.object({
  actionId: z.string().min(1).max(100),
  type: z.literal(NotificationActionType.LINK),
  label: z.string().min(1).max(100),
  variant: notificationActionVariantSchema.optional(),
  url: z.string().min(1),
  openInNewTab: z.boolean().optional(),
});

export type NotificationAction = z.infer<typeof notificationActionSchema>;

/**
 * Notification priority levels
 */
export const notificationPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;

/**
 * Notification metadata schema
 */
export const notificationMetadataSchema = z.object({
  actions: z.array(notificationActionSchema).optional(),
  actionGroupVariant: notificationActionVariantSchema.optional(),
  data: z.record(z.unknown()).optional(),
  expiresAt: z.string().datetime().optional(),
  priority: notificationPrioritySchema.optional(),
});

export type NotificationMetadata = z.infer<typeof notificationMetadataSchema>;

/**
 * Core notification schema
 */
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(1000),
  metadata: notificationMetadataSchema,
  read: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Notification = z.infer<typeof notificationSchema>;

/**
 * Notification preferences schema
 */
export const notificationPreferencesSchema = z.object({
  id: z.string(),
  userId: z.string(),
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  emailTypes: z.array(z.nativeEnum(NotificationType)),
  pushTypes: z.array(z.nativeEnum(NotificationType)),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

/**
 * Delivery strategy types
 */
export const deliveryStrategySchema = z.enum(["sse", "email", "push"]);
export type DeliveryStrategy = z.infer<typeof deliveryStrategySchema>;

/**
 * Notification delivery options
 */
export const notificationDeliveryOptionsSchema = z.object({
  immediate: z.boolean().default(true),
  strategies: z.array(deliveryStrategySchema).optional(),
});

export type NotificationDeliveryOptions = z.infer<
  typeof notificationDeliveryOptionsSchema
>;

/**
 * WebSocket message types
 */
export enum NotificationWSMessageType {
  // Client → Server
  SUBSCRIBE = "subscribe",
  PING = "ping",

  // Server → Client
  CONNECTED = "connected",
  NEW_NOTIFICATION = "new_notification",
  NOTIFICATION_UPDATED = "notification_updated",
  NOTIFICATION_DELETED = "notification_deleted",
  UNREAD_COUNT_CHANGED = "unread_count_changed",
  ERROR = "error",
}

/**
 * WebSocket message schemas
 */

// Client messages
export const subscribeMessageSchema = z.object({
  type: z.literal(NotificationWSMessageType.SUBSCRIBE),
});

export const pingMessageSchema = z.object({
  type: z.literal(NotificationWSMessageType.PING),
});

// Server messages
export const connectedMessageSchema = z.object({
  type: z.literal(NotificationWSMessageType.CONNECTED),
  userId: z.string().nullable(),
  unreadCount: z.number(),
  trace: z.record(z.unknown()).optional(),
});

export const newNotificationMessageSchema = z.object({
  type: z.literal(NotificationWSMessageType.NEW_NOTIFICATION),
  notification: notificationSchema,
  trace: z.record(z.unknown()).optional(),
});

export const notificationUpdatedMessageSchema = z.object({
  type: z.literal(NotificationWSMessageType.NOTIFICATION_UPDATED),
  notification: notificationSchema,
  trace: z.record(z.unknown()).optional(),
});

export const notificationDeletedMessageSchema = z.object({
  type: z.literal(NotificationWSMessageType.NOTIFICATION_DELETED),
  notificationId: z.string(),
  trace: z.record(z.unknown()).optional(),
});

export const unreadCountChangedMessageSchema = z.object({
  type: z.literal(NotificationWSMessageType.UNREAD_COUNT_CHANGED),
  unreadCount: z.number(),
  trace: z.record(z.unknown()).optional(),
});

export const errorMessageSchema = z.object({
  type: z.literal(NotificationWSMessageType.ERROR),
  error: z.string(),
  trace: z.record(z.unknown()).optional(),
});

export type SubscribeMessage = z.infer<typeof subscribeMessageSchema>;
export type PingMessage = z.infer<typeof pingMessageSchema>;
export type ConnectedMessage = z.infer<typeof connectedMessageSchema>;
export type NewNotificationMessage = z.infer<typeof newNotificationMessageSchema>;
export type NotificationUpdatedMessage = z.infer<typeof notificationUpdatedMessageSchema>;
export type NotificationDeletedMessage = z.infer<typeof notificationDeletedMessageSchema>;
export type UnreadCountChangedMessage = z.infer<typeof unreadCountChangedMessageSchema>;
export type ErrorMessage = z.infer<typeof errorMessageSchema>;

/**
 * Union of all WebSocket message types
 */
export const notificationWSMessageSchema = z.discriminatedUnion("type", [
  subscribeMessageSchema,
  pingMessageSchema,
  connectedMessageSchema,
  newNotificationMessageSchema,
  notificationUpdatedMessageSchema,
  notificationDeletedMessageSchema,
  unreadCountChangedMessageSchema,
  errorMessageSchema,
]);

export type NotificationWSMessage = z.infer<typeof notificationWSMessageSchema>;

/**
 * SSE (Server-Sent Events) event types
 */
export enum NotificationSSEEventType {
  // Server → Client only (unidirectional)
  CONNECTED = "connected",
  NEW_NOTIFICATION = "new_notification",
  NOTIFICATION_UPDATED = "notification_updated",
  NOTIFICATION_DELETED = "notification_deleted",
  NOTIFICATIONS_CLEARED = "notifications_cleared",
  UNREAD_COUNT_CHANGED = "unread_count_changed",
  KEEP_ALIVE = "keep_alive",
  ERROR = "error",
}

/**
 * SSE event schemas
 */

// Server events
export const sseConnectedEventSchema = z.object({
  type: z.literal(NotificationSSEEventType.CONNECTED),
  userId: z.string(),
  unreadCount: z.number(),
  timestamp: z.number(),
});

export const sseNewNotificationEventSchema = z.object({
  type: z.literal(NotificationSSEEventType.NEW_NOTIFICATION),
  notification: notificationSchema,
});

export const sseNotificationUpdatedEventSchema = z.object({
  type: z.literal(NotificationSSEEventType.NOTIFICATION_UPDATED),
  notification: notificationSchema,
});

export const sseNotificationDeletedEventSchema = z.object({
  type: z.literal(NotificationSSEEventType.NOTIFICATION_DELETED),
  notificationId: z.string(),
});

export const sseNotificationsClearedEventSchema = z.object({
  type: z.literal(NotificationSSEEventType.NOTIFICATIONS_CLEARED),
  deletedCount: z.number(),
});

export const sseUnreadCountChangedEventSchema = z.object({
  type: z.literal(NotificationSSEEventType.UNREAD_COUNT_CHANGED),
  unreadCount: z.number(),
});

export const sseKeepAliveEventSchema = z.object({
  type: z.literal(NotificationSSEEventType.KEEP_ALIVE),
  timestamp: z.number(),
});

export const sseErrorEventSchema = z.object({
  type: z.literal(NotificationSSEEventType.ERROR),
  error: z.string(),
});

export type SSEConnectedEvent = z.infer<typeof sseConnectedEventSchema>;
export type SSENewNotificationEvent = z.infer<typeof sseNewNotificationEventSchema>;
export type SSENotificationUpdatedEvent = z.infer<
  typeof sseNotificationUpdatedEventSchema
>;
export type SSENotificationDeletedEvent = z.infer<
  typeof sseNotificationDeletedEventSchema
>;
export type SSENotificationsClearedEvent = z.infer<
  typeof sseNotificationsClearedEventSchema
>;
export type SSEUnreadCountChangedEvent = z.infer<typeof sseUnreadCountChangedEventSchema>;
export type SSEKeepAliveEvent = z.infer<typeof sseKeepAliveEventSchema>;
export type SSEErrorEvent = z.infer<typeof sseErrorEventSchema>;

/**
 * Union of all SSE event types
 */
export type SSENotificationEvent =
  | SSEConnectedEvent
  | SSENewNotificationEvent
  | SSENotificationUpdatedEvent
  | SSENotificationDeletedEvent
  | SSENotificationsClearedEvent
  | SSEUnreadCountChangedEvent
  | SSEKeepAliveEvent
  | SSEErrorEvent;

/**
 * REST API schemas
 */

// Create notification request
export const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(1000),
  metadata: notificationMetadataSchema.optional(),
  deliveryOptions: notificationDeliveryOptionsSchema.optional(),
});

export type CreateNotificationRequest = z.infer<typeof createNotificationSchema>;

// List notifications query parameters
export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  filter: z.enum(["all", "read", "unread"]).default("all"),
  type: z.nativeEnum(NotificationType).optional(),
  search: z.string().trim().max(200).optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

// Mark notification read/unread request
export const markNotificationReadSchema = z.object({
  read: z.boolean(),
});

export type MarkNotificationReadRequest = z.infer<typeof markNotificationReadSchema>;

// Update notification preferences request
export const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  emailTypes: z.array(z.nativeEnum(NotificationType)).optional(),
  pushTypes: z.array(z.nativeEnum(NotificationType)).optional(),
});

export type UpdatePreferencesRequest = z.infer<typeof updatePreferencesSchema>;

// Admin send notifications request
export const adminNotificationTargetSchema = z.discriminatedUnion("scope", [
  z.object({
    scope: z.literal("user"),
    identifier: z.string().min(1).max(320),
  }),
  z.object({
    scope: z.literal("users"),
    identifiers: z.array(z.string().min(1).max(320)).min(1).max(10000),
  }),
  z.object({
    scope: z.literal("all"),
  }),
]);

export const adminSendNotificationSchema = z.object({
  target: adminNotificationTargetSchema,
  notification: z.object({
    type: z.nativeEnum(NotificationType),
    title: z.string().min(1).max(255),
    content: z.string().min(1).max(1000),
    metadata: notificationMetadataSchema.optional(),
    deliveryOptions: notificationDeliveryOptionsSchema.optional(),
  }),
});

export type AdminSendNotificationRequest = z.infer<typeof adminSendNotificationSchema>;

/**
 * Pagination response metadata
 */
export const paginationMetadataSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>;

/**
 * List notifications response
 */
export const listNotificationsResponseSchema = z.object({
  success: z.boolean(),
  notifications: z.array(notificationSchema),
  pagination: paginationMetadataSchema,
});

export type ListNotificationsResponse = z.infer<typeof listNotificationsResponseSchema>;

/**
 * Unread count response
 */
export const unreadCountResponseSchema = z.object({
  success: z.boolean(),
  unreadCount: z.number().int().nonnegative(),
});

export type UnreadCountResponse = z.infer<typeof unreadCountResponseSchema>;

/**
 * Generic success response
 */
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type SuccessResponse = z.infer<typeof successResponseSchema>;

/**
 * Generic error response
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
