import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteChatMessageMutation } from "@/hooks/api/useDeleteChatMessageMutation";
import { isEmojiOnlyMessage } from "@/lib/emoji";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CHAT_CONFIG } from "shared";
import type { ChatMessage } from "shared/interfaces/chat";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId?: string;
  isAdmin?: boolean;
}

export const MessageList = ({
  messages,
  currentUserId,
  isAdmin = false,
}: MessageListProps) => {
  const { t } = useTranslation("messages");
  const parentRef = useRef<HTMLDivElement>(null);
  const wasAtBottom = useRef(true);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteMessage = useDeleteChatMessageMutation();

  useEffect(() => {
    if (!selectedMessage) {
      document.body.style.pointerEvents = "";
    }
    return () => {
      document.body.style.pointerEvents = "";
    };
  }, [selectedMessage]);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 96,
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
    <>
      {deleteError && (
        <div className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-800">
          {deleteError}
        </div>
      )}
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
            const isEmojiOnly = isEmojiOnlyMessage(
              message.message,
              CHAT_CONFIG.EMOJI_ONLY_MAX,
            );

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
                className="px-2 py-3"
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
                    <div
                      className={`flex items-start gap-2 ${isOwn ? "justify-end" : ""}`}
                    >
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 self-center"
                              aria-label={t("actions.menu_label")}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isOwn ? "end" : "start"}>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => {
                                setDeleteError(null);
                                setSelectedMessage(message);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("actions.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <div className={`flex flex-col ${isOwn ? "items-end" : ""}`}>
                        <span className="text-sm font-semibold">{message.userName}</span>
                        <span className="text-[0.7rem] font-mono text-muted-foreground">
                          {new Date(message.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`min-w-[10rem] relative mt-2 rounded-lg px-3 py-2 ${
                        isOwn
                          ? "bg-blue-500 text-white text-right"
                          : "bg-gray-100 text-gray-900 text-left"
                      }`}
                    >
                      <span
                        className={`absolute -top-[6px] h-3 w-6 ${
                          isOwn ? "right-3 bg-blue-500" : "left-3 bg-gray-100"
                        }`}
                        style={{ clipPath: "polygon(50% 0, 0 100%, 100% 100%)" }}
                        aria-hidden="true"
                      />
                      <span
                        className={`${isEmojiOnly ? "text-2xl leading-none" : "text-sm"}`}
                      >
                        {message.message}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Dialog
        open={!!selectedMessage}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMessage(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirm.title")}</DialogTitle>
            <DialogDescription>{t("confirm.description")}</DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="mt-3 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              {selectedMessage.message}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedMessage(null)}
            >
              {t("confirm.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (!selectedMessage) return;
                setDeleteError(null);
                try {
                  await deleteMessage.mutateAsync({ id: selectedMessage.id });
                  setSelectedMessage(null);
                } catch {
                  setDeleteError(t("errors.delete_failed"));
                }
              }}
              disabled={deleteMessage.isPending}
            >
              {t("confirm.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
