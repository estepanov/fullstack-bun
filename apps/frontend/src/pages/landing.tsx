import { useBanUserMutation } from "@frontend/hooks/api/useBanUserMutation";
import { useDeleteChatMessageMutation } from "@frontend/hooks/api/useDeleteChatMessageMutation";
import { useUpdateChatMessageMutation } from "@frontend/hooks/api/useUpdateChatMessageMutation";
import { useSession } from "@frontend/lib/auth-client";
import { useChat } from "@frontend/providers/ChatProvider";
import { isAdminSession } from "frontend-common/auth";
import { ChatLayout } from "frontend-common/components/chat/chat-layout";
import {
  Alert,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  InputError,
  Textarea,
} from "frontend-common/components/ui";
import type { Message, User } from "frontend-common/lib/chat-types";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { MESSAGE_CONFIG, getMessageSchema } from "shared";

const LandingPage = () => {
  const { t: tLanding } = useTranslation("landing_page");
  const { t: tMessages } = useTranslation("messages");
  const { data: session } = useSession();
  const isAdmin = isAdminSession(session);
  const {
    onlineCounts,
    conversations,
    messagesByConversation,
    sendMessage,
    sendTypingStatus,
    connectedUserId,
    typingUsersByConversation,
  } = useChat();
  const currentUserId = session?.user?.id ?? connectedUserId ?? "";
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [deleteMessages, setDeleteMessages] = useState(false);
  const [banError, setBanError] = useState<string | null>(null);

  const deleteMessage = useDeleteChatMessageMutation();
  const updateMessage = useUpdateChatMessageMutation();
  const banUser = useBanUserMutation();

  const stats = [
    {
      label: tLanding("online_guests"),
      value: onlineCounts?.guests ?? "-",
    },
    {
      label: tLanding("online_members"),
      value: onlineCounts?.members ?? "-",
    },
    {
      label: tLanding("online_admins"),
      value: onlineCounts?.admins ?? "-",
    },
  ];

  return (
    <div className="app-surface flex-1">
      <Container className="space-y-6 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{tLanding("title")}</h1>
          <p className="text-muted-foreground">{tLanding("description")}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          <Trans
            i18nKey="get_started"
            t={tLanding}
            components={{
              code: (
                <code className="rounded bg-muted/70 px-2 py-1 text-xs text-foreground" />
              ),
            }}
          />
        </p>
        <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {tLanding("online_counts")}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3"
              >
                <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
                <div className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <ChatLayout
          conversations={conversations}
          messages={messagesByConversation}
          currentUserId={currentUserId}
          typingUsers={typingUsersByConversation}
          isAdmin={isAdmin}
          onSendMessage={(_conversationId, message) => {
            sendMessage(message);
          }}
          onTypingStatus={sendTypingStatus}
          onEditMessage={(message) => {
            setEditError(null);
            setEditValue(message.content);
            setTimeout(() => {
              setEditingMessage(message);
            }, 100);
          }}
          onDeleteMessage={(message) => {
            setDeleteError(null);
            setTimeout(() => {
              setSelectedMessage(message);
            }, 100);
          }}
          onBanUser={(user) => {
            setBanError(null);
            setUserToBan(user);
            setTimeout(() => {
              setBanDialogOpen(true);
            }, 100);
          }}
        />
        {deleteError && <Alert variant="destructive">{deleteError}</Alert>}
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
              <DialogTitle>{tMessages("confirm.title")}</DialogTitle>
              <DialogDescription>{tMessages("confirm.description")}</DialogDescription>
            </DialogHeader>
            {selectedMessage && (
              <div className="mt-3 max-h-40 overflow-auto break-all rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                {selectedMessage.content}
              </div>
            )}
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedMessage(null)}
              >
                {tMessages("confirm.cancel")}
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
                    setDeleteError(tMessages("errors.delete_failed"));
                  }
                }}
                disabled={deleteMessage.isPending}
              >
                {tMessages("confirm.confirm")}
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
              <DialogTitle>{tMessages("edit.title")}</DialogTitle>
              <DialogDescription>{tMessages("edit.description")}</DialogDescription>
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
                {tMessages("edit.character_count", {
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
                {tMessages("edit.cancel")}
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
                      setEditError(tMessages("form.errors.single_line"));
                      return;
                    }
                    if (issues.some((issue) => issue.code === "too_small")) {
                      setEditError(tMessages("form.errors.empty"));
                      return;
                    }
                    if (issues.some((issue) => issue.code === "too_big")) {
                      setEditError(
                        tMessages("form.errors.max_length", {
                          max: MESSAGE_CONFIG.MAX_LENGTH,
                        }),
                      );
                      return;
                    }
                    if (
                      issues.some(
                        (issue) => issue.message === "Message cannot contain HTML tags",
                      )
                    ) {
                      setEditError(tMessages("form.errors.no_html"));
                      return;
                    }
                    setEditError(tMessages("form.errors.invalid"));
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
                    setEditError(tMessages("errors.update_failed"));
                  }
                }}
                disabled={updateMessage.isPending || !editValue.trim()}
              >
                {updateMessage.isPending
                  ? tMessages("edit.saving")
                  : tMessages("edit.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <DialogTitle>{tMessages("ban.dialog_title")}</DialogTitle>
              <DialogDescription>{tMessages("ban.dialog_description")}</DialogDescription>
            </DialogHeader>
            {userToBan && (
              <div className="space-y-4">
                <div className="rounded-md bg-muted px-3 py-2">
                  <p className="text-sm font-medium">{userToBan.name}</p>
                </div>
                <Field>
                  <FieldLabel htmlFor="ban-reason">
                    {tMessages("ban.reason_label")}
                  </FieldLabel>
                  <Input
                    id="ban-reason"
                    type="text"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder={tMessages("ban.reason_placeholder")}
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
                    {tMessages("ban.delete_messages_label")}
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
                {tMessages("ban.cancel_button")}
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
                    setBanError(tMessages("errors.ban_failed"));
                  }
                }}
                disabled={banUser.isPending}
              >
                {banUser.isPending
                  ? tMessages("ban.confirming_button")
                  : tMessages("ban.confirm_button")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Container>
    </div>
  );
};

export default LandingPage;
