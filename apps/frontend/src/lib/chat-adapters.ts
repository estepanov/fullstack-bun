import type { ChatMessage } from "shared";
import type {
  Conversation,
  Message,
  User,
} from "frontend-common/lib/chat-types";

/**
 * Determines user status based on online counts and user ID
 * Since users who have sent messages are online, we mark them as online
 */
export function determineUserStatus(
  _userId: string,
  onlineCounts?: { guests: number; members: number; admins: number },
): "online" | "offline" | "away" {
  // If we have online counts and there are people online, mark users as online
  // This is a reasonable assumption since we only see messages from active users
  if (onlineCounts && (onlineCounts.guests + onlineCounts.members + onlineCounts.admins) > 0) {
    return "online";
  }
  return "offline";
}

/**
 * Transforms a ChatMessage from the WebSocket into a Message for the new components
 */
export function chatMessageToMessage(
  chatMsg: ChatMessage,
  onlineCounts?: { guests: number; members: number; admins: number },
): Message {
  return {
    id: chatMsg.id,
    content: chatMsg.message,
    sender: {
      id: chatMsg.userId,
      name: chatMsg.userName,
      avatar: chatMsg.userAvatar || undefined,
      status: determineUserStatus(chatMsg.userId, onlineCounts),
    },
    timestamp: new Date(chatMsg.createdAt),
    status: "sent", // Default status for existing messages
  };
}

/**
 * Reverse transformation: Message → ChatMessage
 * Used when we need to pass data back to existing mutation hooks
 */
export function messageToChatMessage(
  msg: Message,
  editedAt?: string,
): ChatMessage {
  return {
    id: msg.id,
    userId: msg.sender.id,
    userName: msg.sender.name,
    userAvatar: msg.sender.avatar || null,
    message: msg.content,
    timestamp: msg.timestamp.getTime(),
    createdAt: msg.timestamp.toISOString(),
    editedAt,
  };
}

/**
 * Creates a Conversation object from an array of ChatMessages
 * Extracts unique participants and builds conversation metadata
 */
export function createConversationFromMessages(
  messages: ChatMessage[],
  conversationId: string,
  conversationName: string,
  onlineCounts?: { guests: number; members: number; admins: number },
): Conversation {
  // Extract unique users from messages
  const userMap = new Map<string, User>();

  for (const msg of messages) {
    if (!userMap.has(msg.userId)) {
      userMap.set(msg.userId, {
        id: msg.userId,
        name: msg.userName,
        avatar: msg.userAvatar || undefined,
        status: determineUserStatus(msg.userId, onlineCounts),
      });
    }
  }

  const participants = Array.from(userMap.values());

  // Get last message (transformed)
  const lastChatMessage = messages[messages.length - 1];
  const lastMessage = lastChatMessage
    ? chatMessageToMessage(lastChatMessage, onlineCounts)
    : undefined;

  return {
    id: conversationId,
    name: conversationName,
    participants,
    lastMessage,
    unreadCount: 0, // Future: implement unread tracking
    isGroup: true, // For now, treating global chat as a group
  };
}

/**
 * Builds the conversations and messages map from flat message array
 * For now, creates a single "Global Chat" conversation
 * Future: Can be extended to support multiple conversations
 */
export function buildConversationsMap(
  messages: ChatMessage[],
  onlineCounts?: { guests: number; members: number; admins: number },
): {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
} {
  // For now, all messages go into "Global Chat" conversation
  const conversationId = "global";
  const conversationName = "Global Chat";

  // Transform all messages
  const transformedMessages = messages.map((msg) =>
    chatMessageToMessage(msg, onlineCounts),
  );

  // Create conversation
  const conversation = createConversationFromMessages(
    messages,
    conversationId,
    conversationName,
    onlineCounts,
  );

  return {
    conversations: [conversation],
    messagesByConversation: {
      [conversationId]: transformedMessages,
    },
  };
}
