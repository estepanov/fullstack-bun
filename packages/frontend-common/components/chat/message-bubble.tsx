import {
  Ban,
  Check,
  CheckCheck,
  MoreVertical,
  PencilLine,
  Trash2,
} from "lucide-react";
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

export interface MessageBubbleCopy {
  menuLabel: string;
  editLabel: string;
  deleteLabel: string;
  banUserLabel: string;
}

interface MessageBubbleProps {
  message: Message;
  copy: MessageBubbleCopy;
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

const MAX_CONSECUTIVE_EMOJI = 4;

function isEmojiOnly(text: string): boolean {
  // Remove all whitespace for counting
  const trimmed = text.trim();

  if (!trimmed) {
    return false;
  }

  // Regex to match complete emoji sequences including:
  // - ZWJ sequences (like 😶‍🌫️, 👨‍👩‍👧‍👦)
  // - Skin tone modifiers (👍🏽)
  // - Variation selectors (️)
  // - Regional indicators (flags 🇺🇸)
  // This matches a single emoji followed by optional modifiers and ZWJ sequences
  const emojiRegex =
    /\p{Emoji}(?:\p{Emoji_Modifier}|\uFE0F|\u200D\p{Emoji}(?:\p{Emoji_Modifier}|\uFE0F)?)*/gu;

  // Extract all emojis
  const emojis = trimmed.match(emojiRegex);

  // Check if the text contains only emojis (no other characters)
  // and has 4 or fewer emojis
  if (!emojis || emojis.length === 0 || emojis.length > MAX_CONSECUTIVE_EMOJI) {
    return false;
  }

  // Join all matched emojis and compare to trimmed text
  // If they're equal, the text contains only emojis
  const allEmojis = emojis.join("");

  return allEmojis === trimmed;
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
  copy,
  isOwn = false,
  isAdmin = false,
  showAvatar = true,
  showTimestamp = true,
  onEditMessage,
  onDeleteMessage,
  onBanUser,
  className,
}: MessageBubbleProps) {
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
      <div
        className={cn(
          "flex flex-col gap-1",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {!isOwn && (
          <span className="text-xs font-medium text-muted-foreground px-1">
            {message.sender.name}
          </span>
        )}
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl leading-relaxed",
            isEmojiOnly(message.content) ? "text-2xl" : "text-sm",
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
                aria-label={copy.menuLabel}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? "end" : "start"}>
              {onEditMessage && (
                <DropdownMenuItem onSelect={() => onEditMessage(message)}>
                  <PencilLine className="h-4 w-4" />
                  {copy.editLabel}
                </DropdownMenuItem>
              )}
              {onDeleteMessage && (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDeleteMessage(message)}
                >
                  <Trash2 className="h-4 w-4" />
                  {copy.deleteLabel}
                </DropdownMenuItem>
              )}
              {canBan && onBanUser && (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onBanUser(message.sender)}
                >
                  <Ban className="h-4 w-4" />
                  {copy.banUserLabel}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
