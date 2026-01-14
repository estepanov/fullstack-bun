import { useBanUserMutation } from "@frontend/hooks/api/useBanUserMutation";
import { useDeleteChatMessageMutation } from "@frontend/hooks/api/useDeleteChatMessageMutation";
import { useUpdateChatMessageMutation } from "@frontend/hooks/api/useUpdateChatMessageMutation";
import { MessageBubble } from "frontend-common/components/chat/message-bubble";
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Field,
  FieldLabel,
  Input,
  InputError,
  Textarea,
} from "frontend-common/components/ui";
import type { Message } from "frontend-common/lib/chat-types";
import { isEmojiOnlyMessage } from "frontend-common/lib/emoji";
import { Ban, MoreVertical, PencilLine, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ChatMessage } from "shared";
import { CHAT_CONFIG, MESSAGE_CONFIG, getMessageSchema } from "shared";

interface EnhancedMessageBubbleProps {
  message: Message;
  chatMessage: ChatMessage; // Original for admin operations
  isOwn?: boolean;
  isAdmin?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

export const EnhancedMessageBubble = ({
  message,
  chatMessage,
  isOwn = false,
  isAdmin = false,
  showAvatar = true,
  showTimestamp = true,
  className,
}: EnhancedMessageBubbleProps) => {
  const { t } = useTranslation("messages");
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<{ id: string; name: string } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [deleteMessages, setDeleteMessages] = useState(false);
  const [banError, setBanError] = useState<string | null>(null);

  const deleteMessage = useDeleteChatMessageMutation();
  const updateMessage = useUpdateChatMessageMutation();
  const banUser = useBanUserMutation();

  const canManage = isAdmin || isOwn;
  const canBan = isAdmin && !isOwn;
  const isEmojiOnly = isEmojiOnlyMessage(message.content, CHAT_CONFIG.EMOJI_ONLY_MAX);

  // Custom rendering for admin features
  const renderMessageContent = () => {
    return (
      <div className={`relative ${isOwn ? "items-end" : ""}`}>
        <div
          className={`inline-flex gap-2 ${isOwn ? "flex-row-reverse" : "items-start"}`}
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
                    setEditValue(chatMessage.message);
                    setTimeout(() => {
                      setEditingMessage(chatMessage);
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
                    setTimeout(() => {
                      setSelectedMessage(chatMessage);
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
                      setUserToBan({
                        id: chatMessage.userId,
                        name: chatMessage.userName,
                      });
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
        </div>

        {/* Render base MessageBubble with custom content */}
        <div className={isEmojiOnly ? "text-3xl" : ""}>
          <MessageBubble
            message={message}
            isOwn={isOwn}
            showAvatar={showAvatar}
            showTimestamp={showTimestamp}
            className={className}
          />
        </div>

        {/* Show edited indicator if message was edited */}
        {chatMessage.editedAt && (
          <div className={`mt-1 flex ${isOwn ? "justify-end" : "justify-start"}`}>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-muted-foreground/70">
              {t("list.edited")}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {deleteError && <Alert variant="destructive">{deleteError}</Alert>}

      {renderMessageContent()}

      {/* Delete Confirmation Dialog */}
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

      {/* Edit Dialog */}
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
              <Field>
                <FieldLabel htmlFor="ban-reason">{t("ban.reason_label")}</FieldLabel>
                <Input
                  id="ban-reason"
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder={t("ban.reason_placeholder")}
                />
              </Field>
              <Field orientation="horizontal">
                <Input
                  type="checkbox"
                  id="delete-messages"
                  checked={deleteMessages}
                  onChange={(e) => setDeleteMessages(e.target.checked)}
                />
                <FieldLabel htmlFor="delete-messages" className="font-normal">
                  {t("ban.delete_messages_label")}
                </FieldLabel>
              </Field>
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
