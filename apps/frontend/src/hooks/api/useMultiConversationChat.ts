import { useMemo, useState } from "react";
import type { Conversation, Message, User } from "frontend-common/lib/chat-types";
import { buildConversationsMap } from "@frontend/lib/chat-adapters";
import { useChatWebSocket, type UseChatWebSocketReturn } from "./useChatWebSocket";

export interface UseMultiConversationChatReturn extends UseChatWebSocketReturn {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  typingUsersByConversation: Record<string, User[]>;
}

/**
 * Enhanced hook that wraps useChatWebSocket and provides multi-conversation data structure
 * Transforms flat message array into conversations and messages keyed by conversation ID
 */
export const useMultiConversationChat = ({
  roomId = "global",
}: { roomId?: string } = {}): UseMultiConversationChatReturn => {
  const wsData = useChatWebSocket({ roomId });
  const [activeConversationId, setActiveConversationId] = useState("global");

  // Transform messages into conversations and messages by conversation
  const { conversations, messagesByConversation } = useMemo(() => {
    return buildConversationsMap(wsData.messages, wsData.onlineCounts || undefined);
  }, [wsData.messages, wsData.onlineCounts]);

  return {
    ...wsData,
    conversations,
    messagesByConversation,
    activeConversationId,
    setActiveConversationId,
    typingUsersByConversation: wsData.typingUsers,
  };
};
