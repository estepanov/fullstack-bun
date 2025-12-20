import { useVirtualizer } from "@tanstack/react-virtual";
import type { ChatMessage } from "shared/interfaces/chat";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId?: string;
}

export const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const { t } = useTranslation("messages");
  const parentRef = useRef<HTMLDivElement>(null);
  const wasAtBottom = useRef(true);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
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
  useEffect(() => {
    if (wasAtBottom.current && parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        <p>{t("list.empty")}</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-[300px] overflow-y-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          const isOwn = message.userId === currentUserId;

          return (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="py-2 px-2"
            >
              <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.userAvatar ? (
                    <img
                      src={message.userAvatar}
                      alt={message.userName}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-semibold text-white">
                      {message.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Message content */}
                <div className={`flex flex-col ${isOwn ? "items-end" : ""}`}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">
                      {message.userName}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    className={`relative mt-1 rounded-lg px-3 py-2 text-sm ${
                      isOwn
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <span
                      className={`absolute -top-1 h-2 w-2 rotate-45 ${
                        isOwn ? "right-3 bg-blue-500" : "left-3 bg-gray-100"
                      }`}
                      aria-hidden="true"
                    />
                    {message.message}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
