import type { Conversation, Message, User } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import { Alert } from "../ui";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";

interface ChatViewProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
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
        onBack={onBack}
      />
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
        isAdmin={isAdmin}
        onEditMessage={(message) => onEditMessage?.(message, conversation)}
        onDeleteMessage={(message) => onDeleteMessage?.(message, conversation)}
        onBanUser={(user) => onBanUser?.(user, conversation)}
      />
      {currentUserId ? (
        <MessageInput
          disabled={!currentUserId}
          onSend={onSendMessage}
          onTypingStatus={onTypingStatus}
        />
      ) : (
        <Alert variant="info" className="m-4">
          You need to be logged in to send messages
        </Alert>
      )}
    </div>
  );
}
