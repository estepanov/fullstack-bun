import { useVirtualizer } from "@tanstack/react-virtual";
import { TypingIndicator } from "frontend-common/components/chat/typing-indicator";
import type { Message, User } from "frontend-common/lib/chat-types";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ChatMessage } from "shared";
import { EnhancedMessageBubble } from "./EnhancedMessageBubble";

interface EnhancedMessageListProps {
  messages: Message[];
  chatMessages: ChatMessage[]; // Original messages for admin operations
  currentUserId: string;
  isAdmin?: boolean;
  typingUsers?: User[];
  className?: string;
}

export const EnhancedMessageList = ({
  messages,
  chatMessages,
  currentUserId,
  isAdmin = false,
  typingUsers = [],
  className,
}: EnhancedMessageListProps) => {
  const { t } = useTranslation("messages");
  const typingCopy = {
    typingText: (users: User[]) =>
      users.length === 1
        ? t("typing.single", { name: users[0].name })
        : users.length === 2
          ? t("typing.two", {
              first: users[0].name,
              second: users[1].name,
            })
          : t("typing.many", { name: users[0].name, count: users.length - 1 }),
  };
  const parentRef = useRef<HTMLDivElement>(null);
  const wasAtBottom = useRef(true);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  // Track if user is at bottom before scroll
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleScroll = () => {
      const isAtBottom =
        parent.scrollHeight - parent.scrollTop - parent.clientHeight < 50;
      wasAtBottom.current = isAtBottom;
    };

    parent.addEventListener("scroll", handleScroll);
    return () => parent.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll to bottom on new messages if already at bottom
  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally trigger on messages.length and typingUsers.length changes
  useEffect(() => {
    if (wasAtBottom.current && parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [messages.length, typingUsers.length]);

  if (messages.length === 0) {
    return (
      <div className="flex h-75 items-center justify-center text-muted-foreground">
        <p>{t("list.empty")}</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`flex-1 overflow-y-auto rounded-lg bg-muted/20 p-3 shadow-sm dark:bg-muted/20 ${className || ""}`}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          const chatMessage = chatMessages[virtualItem.index];
          const isOwn = message.sender.id === currentUserId;

          // Determine if we should show avatar
          // Hide avatar if previous message is from same sender
          const prevMessage = messages[virtualItem.index - 1];
          const showAvatar = !prevMessage || prevMessage.sender.id !== message.sender.id;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={(node) => {
                if (!node) return;
                virtualizer.measureElement(node);
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="px-1 py-2"
            >
              <EnhancedMessageBubble
                message={message}
                chatMessage={chatMessage}
                isOwn={isOwn}
                isAdmin={isAdmin}
                showAvatar={showAvatar}
                showTimestamp={true}
              />
            </div>
          );
        })}
      </div>

      {/* Typing indicator at bottom */}
      {typingUsers.length > 0 && (
        <div className="mt-2">
          <TypingIndicator users={typingUsers} copy={typingCopy} />
        </div>
      )}
    </div>
  );
};
