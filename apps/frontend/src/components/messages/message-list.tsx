import { useBanUserMutation } from "@/hooks/api/useBanUserMutation";
import { useDeleteChatMessageMutation } from "@/hooks/api/useDeleteChatMessageMutation";
import { useUpdateChatMessageMutation } from "@/hooks/api/useUpdateChatMessageMutation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Alert, Button, InputError } from "frontend-common/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "frontend-common/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "frontend-common/components/ui";
import { Input, Label } from "frontend-common/components/ui";
import { Textarea } from "frontend-common/components/ui";
import { isEmojiOnlyMessage } from "frontend-common/lib";
import { Ban, MoreVertical, PencilLine, Trash2 } from "lucide-react";
import type { CSSProperties, Key } from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CHAT_CONFIG, MESSAGE_CONFIG, getMessageSchema } from "shared";
import type { ChatMessage } from "shared";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId?: string;
  isAdmin?: boolean;
  disableVirtualization?: boolean;
}

export const MessageList = ({
  messages,
  currentUserId,
  isAdmin = false,
  disableVirtualization = false,
}: MessageListProps) => {
  const { t } = useTranslation("messages");
  const parentRef = useRef<HTMLDivElement>(null);
  const wasAtBottom = useRef(true);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<{ id: string; name: string } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [deleteMessages, setDeleteMessages] = useState(false);
  const [banError, setBanError] = useState<string | null>(null);
  const deleteMessage = useDeleteChatMessageMutation();
  const updateMessage = useUpdateChatMessageMutation();
  const banUser = useBanUserMutation();

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: ref
  useEffect(() => {
    if (wasAtBottom.current && parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex h-75 items-center justify-center text-muted-foreground">
        <p>{t("list.empty")}</p>
      </div>
    );
  }

  const renderMessage = (
    message: ChatMessage,
    index: number,
    {
      key,
      style,
      ref,
    }: {
      key: Key;
      style?: CSSProperties;
      ref?: (node: HTMLDivElement | null) => void;
    },
  ) => {
    const isOwn = message.userId === currentUserId;
    const canManage = isAdmin || isOwn;
    const canBan = isAdmin && !isOwn;
    const isEmojiOnly = isEmojiOnlyMessage(message.message, CHAT_CONFIG.EMOJI_ONLY_MAX);

    return (
      <div key={key} data-index={index} ref={ref} style={style} className="px-1 py-2">
        <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
          {/* Avatar */}
          <div className="shrink-0">
            {message.userAvatar ? (
              <img
                src={message.userAvatar}
                alt={message.userName}
                className="h-9 w-9 rounded-full ring-1 ring-border/60"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground ring-1 ring-border/60">
                {message.userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Message content */}
          <div className={`flex min-w-0 flex-col ${isOwn ? "items-end" : ""}`}>
            <div
              className={`inline-flex gap-2 ${isOwn ? "flex-row justify-end" : "items-start"}`}
            >
              {canManage && (
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
                      onSelect={() => {
                        setEditError(null);
                        setEditValue(message.message);
                        setTimeout(() => {
                          setEditingMessage(message);
                        }, 100);
                      }}
                    >
                      <PencilLine className="h-4 w-4" />
                      {t("actions.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => {
                        setDeleteError(null);
                        // Use setTimeout to ensure dropdown closes before dialog opens
                        setTimeout(() => {
                          setSelectedMessage(message);
                        }, 100);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("actions.delete")}
                    </DropdownMenuItem>
                    {canBan && (
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => {
                          setBanError(null);
                          setUserToBan({ id: message.userId, name: message.userName });
                          // Use setTimeout to ensure dropdown closes before dialog opens
                          setTimeout(() => {
                            setBanDialogOpen(true);
                          }, 100);
                        }}
                      >
                        <Ban className="h-4 w-4" />
                        {t("actions.ban_user")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <div className={`flex flex-col ${isOwn ? "items-end" : ""}`}>
                <span className="text-sm font-semibold text-foreground/90">
                  {message.userName}
                </span>
                <div className="flex items-center gap-2 text-[0.7rem] font-mono text-muted-foreground/80">
                  <span>
                    {new Date(message.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  {message.editedAt && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-muted-foreground/70">
                      {t("list.edited")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div
              data-message-bubble
              className={`relative mt-1.25 min-w-14 rounded-2xl border px-3 py-2 text-sm leading-relaxed shadow-sm ${
                isOwn
                  ? "border-primary/30 bg-primary text-primary-foreground text-right"
                  : "border-border/60 bg-card text-foreground text-left"
              }`}
            >
              <span
                className={`absolute -top-1.75 h-2 w-4.5 ${
                  isOwn ? "right-3 bg-primary/30" : "left-3 bg-border/60"
                }`}
                style={{
                  clipPath: "polygon(50% 0, 0 100%, 100% 100%)",
                  transform: "translateY(-1px) scale(1.08)",
                  transformOrigin: "top center",
                }}
                aria-hidden="true"
              />
              <span
                className={`absolute -top-1.75 h-2 w-4.5 ${
                  isOwn ? "right-3 bg-primary" : "left-3 bg-card"
                }`}
                style={{ clipPath: "polygon(50% 0, 0 100%, 100% 100%)" }}
                aria-hidden="true"
              />
              <span
                className={`block whitespace-pre-wrap break-all ${
                  isEmojiOnly ? "text-3xl leading-none" : ""
                }`}
              >
                {message.message}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {deleteError && <Alert variant="destructive">{deleteError}</Alert>}
      <div
        ref={parentRef}
        className="h-75 overflow-y-auto rounded-lg bg-muted/20 p-3 shadow-sm dark:bg-muted/20"
      >
        {disableVirtualization ? (
          <div className="flex flex-col">
            {messages.map((message, index) =>
              renderMessage(message, index, {
                key: message.id ?? index,
              }),
            )}
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const message = messages[virtualItem.index];

              return renderMessage(message, virtualItem.index, {
                key: virtualItem.key,
                ref: (node) => {
                  if (!node) return;
                  node.dataset.index = String(virtualItem.index);
                  virtualizer.measureElement(node);
                },
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                },
              });
            })}
          </div>
        )}
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
            <div className="mt-3 max-h-40 overflow-auto break-all rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
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

      <Dialog
        open={!!editingMessage}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMessage(null);
            setEditValue("");
            setEditError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("edit.title")}</DialogTitle>
            <DialogDescription>{t("edit.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={editValue}
              onChange={(e) => {
                const nextValue = isAdmin
                  ? e.target.value
                  : e.target.value.replace(/[\r\n]+/g, " ");
                setEditValue(nextValue);
                if (editError) setEditError(null);
              }}
              rows={isAdmin ? MESSAGE_CONFIG.DEFAULT_ROWS : 2}
              maxLength={MESSAGE_CONFIG.MAX_LENGTH}
            />
            <div className="text-xs text-muted-foreground text-right">
              {t("edit.character_count", {
                count: editValue.length,
                max: MESSAGE_CONFIG.MAX_LENGTH,
              })}
            </div>
            {editError && <InputError>{editError}</InputError>}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingMessage(null);
                setEditValue("");
                setEditError(null);
              }}
            >
              {t("edit.cancel")}
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!editingMessage) return;
                setEditError(null);

                const validation = getMessageSchema({
                  allowNewlines: isAdmin,
                }).safeParse(editValue);

                if (!validation.success) {
                  const issues = validation.error.issues;
                  if (
                    issues.some(
                      (issue) => issue.message === "Message must be a single line",
                    )
                  ) {
                    setEditError(t("form.errors.single_line"));
                    return;
                  }
                  if (issues.some((issue) => issue.code === "too_small")) {
                    setEditError(t("form.errors.empty"));
                    return;
                  }
                  if (issues.some((issue) => issue.code === "too_big")) {
                    setEditError(
                      t("form.errors.max_length", { max: MESSAGE_CONFIG.MAX_LENGTH }),
                    );
                    return;
                  }
                  if (
                    issues.some(
                      (issue) => issue.message === "Message cannot contain HTML tags",
                    )
                  ) {
                    setEditError(t("form.errors.no_html"));
                    return;
                  }
                  setEditError(t("form.errors.invalid"));
                  return;
                }

                try {
                  await updateMessage.mutateAsync({
                    id: editingMessage.id,
                    message: editValue,
                  });
                  setEditingMessage(null);
                  setEditValue("");
                } catch {
                  setEditError(t("errors.update_failed"));
                }
              }}
              disabled={updateMessage.isPending || !editValue.trim()}
            >
              {updateMessage.isPending ? t("edit.saving") : t("edit.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog
        open={banDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBanDialogOpen(false);
            setUserToBan(null);
            setBanReason("");
            setDeleteMessages(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("ban.dialog_title")}</DialogTitle>
            <DialogDescription>{t("ban.dialog_description")}</DialogDescription>
          </DialogHeader>
          {userToBan && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted px-3 py-2">
                <p className="text-sm font-medium">{userToBan.name}</p>
              </div>
              <div>
                <Label htmlFor="ban-reason" className="block mb-1">
                  {t("ban.reason_label")}
                </Label>
                <Input
                  id="ban-reason"
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder={t("ban.reason_placeholder")}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="checkbox"
                  id="delete-messages"
                  checked={deleteMessages}
                  onChange={(e) => setDeleteMessages(e.target.checked)}
                />
                <Label htmlFor="delete-messages">{t("ban.delete_messages_label")}</Label>
              </div>
              {banError && <Alert variant="destructive">{banError}</Alert>}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBanDialogOpen(false);
                setUserToBan(null);
                setBanReason("");
                setDeleteMessages(false);
              }}
            >
              {t("ban.cancel_button")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (!userToBan) return;
                setBanError(null);
                try {
                  await banUser.mutateAsync({
                    id: userToBan.id,
                    reason: banReason || undefined,
                    deleteMessages,
                  });
                  setBanDialogOpen(false);
                  setUserToBan(null);
                  setBanReason("");
                  setDeleteMessages(false);
                } catch {
                  setBanError(t("errors.ban_failed"));
                }
              }}
              disabled={banUser.isPending}
            >
              {banUser.isPending ? t("ban.confirming_button") : t("ban.confirm_button")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
