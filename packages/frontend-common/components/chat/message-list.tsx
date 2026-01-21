"use client";

import { MessageSquarePlus } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Message, User } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import { MessageBubble, type MessageBubbleCopy } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import type { TypingIndicatorCopy } from "./typing-indicator";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  copy: MessageListCopy;
  messageBubbleCopy: MessageBubbleCopy;
  typingUsers?: User[];
  isAdmin?: boolean;
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (message: Message) => void;
  onBanUser?: (user: Message["sender"]) => void;
  className?: string;
}

export interface MessageListCopy extends TypingIndicatorCopy {
  emptyTitle: string;
  emptySubtitle: string;
  todayLabel: string;
  yesterdayLabel: string;
}

function formatDateDivider(
  date: Date,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return todayLabel;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return yesterdayLabel;
  }
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

export function MessageList({
  messages,
  currentUserId,
  copy,
  messageBubbleCopy,
  typingUsers = [],
  isAdmin = false,
  onEditMessage,
  onDeleteMessage,
  onBanUser,
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasMessages = messages.length > 0;
    const hasTypers = typingUsers.length > 0;

    if (hasMessages || hasTypers) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, typingUsers.length]);

  if (messages.length === 0) {
    return (
      <div className={cn("flex-1 overflow-y-auto p-4 space-y-4", className)}>
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-muted bg-muted/50 px-6 py-10 mb-0 text-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
              <MessageSquarePlus className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">{copy.emptyTitle}</p>
              <p className="text-sm">{copy.emptySubtitle}</p>
            </div>
          </div>
        </div>
        {typingUsers.length > 0 && <TypingIndicator users={typingUsers} copy={copy} />}
        <div ref={bottomRef} />
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  // biome-ignore lint/complexity/noForEach: <explanation>
  messages.forEach((message) => {
    const messageDate = message.timestamp.toDateString();
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groupedMessages.push({ date: messageDate, messages: [message] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  });

  return (
    <div className={cn("flex-1 overflow-y-auto p-4 space-y-4", className)}>
      {groupedMessages.map((group) => (
        <div key={group.date} className="space-y-3">
          <div className="flex items-center justify-center">
            <span className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted rounded-full">
              {formatDateDivider(
                new Date(group.date),
                copy.todayLabel,
                copy.yesterdayLabel,
              )}
            </span>
          </div>
          {group.messages.map((message, index) => {
            const isOwn = message.sender.id === currentUserId;
            const prevMessage = group.messages[index - 1];
            const showAvatar =
              !prevMessage || prevMessage.sender.id !== message.sender.id;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                copy={messageBubbleCopy}
                isOwn={isOwn}
                isAdmin={isAdmin}
                showAvatar={showAvatar}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
                onBanUser={onBanUser}
              />
            );
          })}
        </div>
      ))}
      {typingUsers.length > 0 && <TypingIndicator users={typingUsers} copy={copy} />}
      <div ref={bottomRef} />
    </div>
  );
}
