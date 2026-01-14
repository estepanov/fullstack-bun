"use client";

import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Conversation, Message, User } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import { ChatView } from "./chat-view";
import { ConversationList } from "./conversation-list";

interface ChatLayoutProps {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  currentUserId: string;
  typingUsers?: Record<string, User[]>;
  isAdmin?: boolean;
  onSendMessage?: (conversationId: string, message: string) => void;
  onTypingStatus?: (isTyping: boolean) => void;
  onNewConversation?: () => void;
  onEditMessage?: (message: Message, conversation: Conversation) => void;
  onDeleteMessage?: (message: Message, conversation: Conversation) => void;
  onBanUser?: (user: User, conversation: Conversation) => void;
  className?: string;
}

export function ChatLayout({
  conversations,
  messages,
  currentUserId,
  typingUsers = {},
  isAdmin = false,
  onSendMessage,
  onTypingStatus,
  onNewConversation,
  onEditMessage,
  onDeleteMessage,
  onBanUser,
  className,
}: ChatLayoutProps) {
  const { t } = useTranslation("messages");
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(
    conversations[0]?.id,
  );
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    if (conversations.length === 0) {
      if (activeConversationId !== undefined) {
        setActiveConversationId(undefined);
      }
      return;
    }

    const nextId = conversations[0]?.id;
    if (
      !activeConversationId ||
      !conversations.some((c) => c.id === activeConversationId)
    ) {
      if (nextId && nextId !== activeConversationId) {
        setActiveConversationId(nextId);
      }
    }
  }, [activeConversationId, conversations]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const activeTypingUsers = activeConversationId
    ? typingUsers[activeConversationId] || []
    : [];

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversationId(conversation.id);
    setShowMobileChat(true);
  };

  return (
    <div
      className={cn(
        "flex h-8/12 overflow-hidden rounded-xl border border-border",
        className,
      )}
    >
      {/* Sidebar - hidden on mobile when chat is active */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 border-r border-border shrink-0",
          showMobileChat && "hidden md:block",
        )}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onSelectConversation={handleSelectConversation}
          onNewConversation={onNewConversation}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
          onBanUser={onBanUser}
        />
      </div>

      {/* Main chat area */}
      <div className={cn("flex-1 min-w-0", !showMobileChat && "hidden md:block")}>
        {activeConversation ? (
          <ChatView
            conversation={activeConversation}
            messages={activeMessages}
            currentUserId={currentUserId}
            typingUsers={activeTypingUsers}
            isAdmin={isAdmin}
            onSendMessage={(message) => onSendMessage?.(activeConversation.id, message)}
            onTypingStatus={onTypingStatus}
            onBack={() => setShowMobileChat(false)}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            onBanUser={onBanUser}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t("chat_layout.empty_title")}</p>
            <p className="text-sm">{t("chat_layout.empty_subtitle")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
