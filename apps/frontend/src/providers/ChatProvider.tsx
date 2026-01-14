import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import {
  useMultiConversationChat,
  type UseMultiConversationChatReturn,
} from "@frontend/hooks/api/useMultiConversationChat";

const ChatContext = createContext<UseMultiConversationChatReturn | null>(null);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const chat = useMultiConversationChat({ roomId: "global" });

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
};

export const useChat = (): UseMultiConversationChatReturn => {
  const chat = useContext(ChatContext);
  if (!chat) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return chat;
};
