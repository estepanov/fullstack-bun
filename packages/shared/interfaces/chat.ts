import { z } from "zod";
import { MESSAGE_CONFIG } from "../config/chat";

// WebSocket message types
export enum ChatWSMessageType {
  // Client -> Server
  SEND_MESSAGE = "send_message",

  // Server -> Client
  NEW_MESSAGE = "new_message",
  MESSAGE_HISTORY = "message_history",
  MESSAGE_DELETED = "message_deleted",
  ERROR = "error",
  CONNECTED = "connected",
}

const htmlTagRegex = /<\s*\/?\s*[a-z][^>]*>/i;
const baseMessageSchema = z
  .string()
  .trim()
  .min(MESSAGE_CONFIG.MIN_LENGTH)
  .max(MESSAGE_CONFIG.MAX_LENGTH)
  .refine((message) => !htmlTagRegex.test(message), {
    message: "Message cannot contain HTML tags",
  });

export const getMessageSchema = (options?: { allowNewlines?: boolean }) =>
  baseMessageSchema.refine(
    (message) => (options?.allowNewlines ? true : !/[\r\n]/.test(message)),
    { message: "Message must be a single line" },
  );

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().nullable(),
  message: baseMessageSchema,
  timestamp: z.number(),
  createdAt: z.string(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Client -> Server: Send message
export const getSendMessageSchema = (options?: { allowNewlines?: boolean }) =>
  z.object({
    type: z.literal(ChatWSMessageType.SEND_MESSAGE),
    message: getMessageSchema(options),
  });

export const sendMessageSchema = getSendMessageSchema();

export type SendMessagePayload = z.infer<typeof sendMessageSchema>;

const wsTraceSchema = z.object({
  requestId: z.string(),
  sessionId: z.string(),
});

// Server -> Client: New message
export const newMessageSchema = z.object({
  type: z.literal(ChatWSMessageType.NEW_MESSAGE),
  data: chatMessageSchema,
  trace: wsTraceSchema.optional(),
});

export type NewMessagePayload = z.infer<typeof newMessageSchema>;

// Server -> Client: Message history
export const messageHistorySchema = z.object({
  type: z.literal(ChatWSMessageType.MESSAGE_HISTORY),
  data: z.array(chatMessageSchema),
  trace: wsTraceSchema.optional(),
});

export type MessageHistoryPayload = z.infer<typeof messageHistorySchema>;

// Server -> Client: Message deleted
export const messageDeletedSchema = z.object({
  type: z.literal(ChatWSMessageType.MESSAGE_DELETED),
  messageId: z.string(),
  trace: wsTraceSchema.optional(),
});

export type MessageDeletedPayload = z.infer<typeof messageDeletedSchema>;

// Server -> Client: Error
export const errorMessageSchema = z.object({
  type: z.literal(ChatWSMessageType.ERROR),
  error: z.string(),
  trace: wsTraceSchema.optional(),
});

export type ErrorMessagePayload = z.infer<typeof errorMessageSchema>;

// Server -> Client: Connected
export const connectedMessageSchema = z.object({
  type: z.literal(ChatWSMessageType.CONNECTED),
  userId: z.string().nullable(),
  trace: wsTraceSchema.optional(),
});

export type ConnectedMessagePayload = z.infer<typeof connectedMessageSchema>;

// Union type for all WebSocket messages
export type ChatWSMessage =
  | SendMessagePayload
  | NewMessagePayload
  | MessageHistoryPayload
  | MessageDeletedPayload
  | ErrorMessagePayload
  | ConnectedMessagePayload;
