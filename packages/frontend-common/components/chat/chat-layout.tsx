"use client";

import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import type { Conversation, Message, User } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import { ChatView, type ChatViewCopy } from "./chat-view";
import { ConversationList, type ConversationListCopy } from "./conversation-list";

interface ChatLayoutProps {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  currentUserId: string;
  copy: ChatLayoutCopy;
  typingUsers?: Record<string, User[]>;
  isAdmin?: boolean;
  profileIncomplete?: boolean;
  emailVerified?: boolean;
  throttle?: {
    remainingMs: number;
    limit: number;
    windowMs: number;
    restoreMessage?: string;
  } | null;
  onSendMessage?: (conversationId: string, message: string) => void;
  onTypingStatus?: (isTyping: boolean) => void;
  onNewConversation?: () => void;
  onEditMessage?: (message: Message, conversation: Conversation) => void;
  onDeleteMessage?: (message: Message, conversation: Conversation) => void;
  onBanUser?: (user: User, conversation: Conversation) => void;
  className?: string;
}

export interface ChatLayoutCopy {
  emptyTitle: string;
  emptySubtitle: string;
  conversationList: ConversationListCopy;
  chatView: ChatViewCopy;
}

export function ChatLayout({
  conversations,
  messages,
  currentUserId,
  copy,
  typingUsers = {},
  isAdmin = false,
  profileIncomplete = false,
  emailVerified = true,
  throttle = null,
  onSendMessage,
  onTypingStatus,
  onNewConversation,
  onEditMessage,
  onDeleteMessage,
  onBanUser,
  className,
}: ChatLayoutProps) {
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
        "flex h-8/12 max-h-[calc(80dvh)] overflow-hidden rounded-xl border border-border",
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
          copy={copy.conversationList}
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
            copy={copy.chatView}
            typingUsers={activeTypingUsers}
            isAdmin={isAdmin}
            profileIncomplete={profileIncomplete}
            emailVerified={emailVerified}
            throttle={throttle}
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
            <p className="text-lg font-medium">{copy.emptyTitle}</p>
            <p className="text-sm">{copy.emptySubtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
}
