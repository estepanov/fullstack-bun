import { Ban, Check, CheckCheck, MoreVertical, PencilLine, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Message } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui";
import { UserAvatar } from "../ui/user-avatar";

interface MessageBubbleProps {
  message: Message;
  isOwn?: boolean;
  isAdmin?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (message: Message) => void;
  onBanUser?: (user: Message["sender"]) => void;
  className?: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageStatus({ status }: { status?: Message["status"] }) {
  if (!status || status === "sending") {
    return <Check className="h-3.5 w-3.5 text-muted-foreground/50" />;
  }
  if (status === "sent") {
    return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
}

export function MessageBubble({
  message,
  isOwn = false,
  isAdmin = false,
  showAvatar = true,
  showTimestamp = true,
  onEditMessage,
  onDeleteMessage,
  onBanUser,
  className,
}: MessageBubbleProps) {
  const { t } = useTranslation("messages");
  const canManage = isAdmin || isOwn;
  const canBan = isAdmin && !isOwn;
  const hasMenu =
    canManage && (onEditMessage || onDeleteMessage || (canBan && onBanUser));

  return (
    <div
      className={cn(
        "flex gap-2.5 max-w-[85%]",
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto",
        className,
      )}
    >
      {showAvatar && !isOwn && (
        <UserAvatar user={message.sender} size="sm" className="mt-1 shrink-0" />
      )}
      <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {!isOwn && (
          <span className="text-xs font-medium text-muted-foreground px-1">
            {message.sender.name}
          </span>
        )}
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border rounded-bl-md",
          )}
        >
          {message.content}
        </div>
        {showTimestamp && (
          <div className="flex items-center gap-1 px-1">
            <span className="text-[11px] text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
            {isOwn && <MessageStatus status={message.status} />}
          </div>
        )}
      </div>
      {hasMenu && (
        <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label={t("actions.menu_label")}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? "end" : "start"}>
              {onEditMessage && (
                <DropdownMenuItem onSelect={() => onEditMessage(message)}>
                  <PencilLine className="h-4 w-4" />
                  {t("actions.edit")}
                </DropdownMenuItem>
              )}
              {onDeleteMessage && (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDeleteMessage(message)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("actions.delete")}
                </DropdownMenuItem>
              )}
              {canBan && onBanUser && (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onBanUser(message.sender)}
                >
                  <Ban className="h-4 w-4" />
                  {t("actions.ban_user")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
