import { Ban, MoreVertical, PencilLine, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Conversation, Message, User } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui";
import { UserAvatar } from "../ui/user-avatar";

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  currentUserId: string;
  isAdmin?: boolean;
  onClick?: () => void;
  onEditMessage?: (message: Message, conversation: Conversation) => void;
  onDeleteMessage?: (message: Message, conversation: Conversation) => void;
  onBanUser?: (user: User, conversation: Conversation) => void;
  className?: string;
}

export function ConversationItem({
  conversation,
  isActive = false,
  currentUserId,
  isAdmin = false,
  onClick,
  onEditMessage,
  onDeleteMessage,
  onBanUser,
  className,
}: ConversationItemProps) {
  const { t } = useTranslation("messages");
  const otherParticipants = conversation.participants.filter(
    (p) => p.id !== currentUserId,
  );
  const displayUser = otherParticipants[0];
  const lastMessage = conversation.lastMessage;
  const isOwn = lastMessage?.sender.id === currentUserId;
  const canManage = !!lastMessage && (isAdmin || isOwn);
  const canBan = !!lastMessage && isAdmin && !isOwn;
  const hasMenu =
    canManage && (onEditMessage || onDeleteMessage || (canBan && onBanUser));

  const formatLastMessageTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t("conversation_item.time_now");
    if (minutes < 60) return t("conversation_item.minutes", { count: minutes });
    if (hours < 24) return t("conversation_item.hours", { count: hours });
    if (days < 7) return t("conversation_item.days", { count: days });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const displayName =
    conversation.name ||
    (conversation.isGroup
      ? otherParticipants.map((p) => p.name.split(" ")[0]).join(", ")
      : displayUser?.name);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
        "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isActive && "bg-accent",
        className,
      )}
    >
      {conversation.isGroup ? (
        <div className="relative h-12 w-12 shrink-0">
          <UserAvatar
            user={otherParticipants[0]}
            size="sm"
            className="absolute top-0 left-0"
          />
          <UserAvatar
            user={otherParticipants[1] || otherParticipants[0]}
            size="sm"
            className="absolute rounded-full bottom-0 right-0 ring-2 ring-background"
          />
        </div>
      ) : (
        <UserAvatar user={displayUser} size="lg" showStatus />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{displayName}</span>
          {lastMessage && (
            <span className="text-[11px] text-muted-foreground shrink-0">
              {formatLastMessageTime(lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {lastMessage && (
            <p className="text-sm text-muted-foreground truncate">
              {lastMessage.sender.id === currentUserId && (
                <span className="text-foreground/70">
                  {t("conversation_item.you_prefix")}
                </span>
              )}
              {lastMessage.content}
            </p>
          )}
          {conversation?.unreadCount && conversation.unreadCount > 0 ? (
            <span className="shrink-0 flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
      {hasMenu && lastMessage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              aria-label={t("actions.menu_label")}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEditMessage && (
              <DropdownMenuItem
                onSelect={(event) => {
                  event.stopPropagation();
                  onEditMessage?.(lastMessage, conversation);
                }}
              >
                <PencilLine className="h-4 w-4" />
                {t("actions.edit")}
              </DropdownMenuItem>
            )}
            {onDeleteMessage && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.stopPropagation();
                  onDeleteMessage?.(lastMessage, conversation);
                }}
              >
                <Trash2 className="h-4 w-4" />
                {t("actions.delete")}
              </DropdownMenuItem>
            )}
            {canBan && onBanUser && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.stopPropagation();
                  onBanUser?.(lastMessage.sender, conversation);
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
  );
}
