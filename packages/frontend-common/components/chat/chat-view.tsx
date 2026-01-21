import type React from "react";
import type { Conversation, Message, User } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import { Alert } from "../ui";
import { ChatHeader, type ChatHeaderCopy } from "./chat-header";
import type { MessageBubbleCopy } from "./message-bubble";
import { MessageInput, type MessageInputCopy } from "./message-input";
import { MessageList, type MessageListCopy } from "./message-list";

export interface ChatViewCopy {
  header: ChatHeaderCopy;
  messageList: MessageListCopy;
  messageBubble: MessageBubbleCopy;
  messageInput: MessageInputCopy;
  unauthenticatedContent: React.ReactNode;
}

interface ChatViewProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  copy: ChatViewCopy;
  typingUsers?: User[];
  isAdmin?: boolean;
  onSendMessage?: (message: string) => void;
  onTypingStatus?: (isTyping: boolean) => void;
  onBack?: () => void;
  onEditMessage?: (message: Message, conversation: Conversation) => void;
  onDeleteMessage?: (message: Message, conversation: Conversation) => void;
  onBanUser?: (user: User, conversation: Conversation) => void;
  className?: string;
}

export function ChatView({
  conversation,
  messages,
  currentUserId,
  copy,
  typingUsers = [],
  isAdmin = false,
  onSendMessage,
  onTypingStatus,
  onBack,
  onEditMessage,
  onDeleteMessage,
  onBanUser,
  className,
}: ChatViewProps) {
  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <ChatHeader
        conversation={conversation}
        currentUserId={currentUserId}
        copy={copy.header}
        onBack={onBack}
      />
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        copy={copy.messageList}
        messageBubbleCopy={copy.messageBubble}
        typingUsers={typingUsers}
        isAdmin={isAdmin}
        onEditMessage={(message) => onEditMessage?.(message, conversation)}
        onDeleteMessage={(message) => onDeleteMessage?.(message, conversation)}
        onBanUser={(user) => onBanUser?.(user, conversation)}
      />
      {currentUserId ? (
        <MessageInput
          disabled={!currentUserId}
          copy={copy.messageInput}
          onSend={onSendMessage}
          onTypingStatus={onTypingStatus}
        />
      ) : (
        <Alert variant="info" className="m-4">
          {copy.unauthenticatedContent}
        </Alert>
      )}
    </div>
  );
}
