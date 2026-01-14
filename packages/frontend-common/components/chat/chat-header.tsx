import { ChevronLeft, MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Conversation } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import { Button } from "../ui";
import { UserAvatar } from "./user-avatar";

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId: string;
  onBack?: () => void;
  onMore?: () => void;
  className?: string;
}

export function ChatHeader({
  conversation,
  currentUserId,
  onBack,
  onMore,
  className,
}: ChatHeaderProps) {
  const { t } = useTranslation("messages");
  const hasCurrentUser = Boolean(currentUserId);
  const otherParticipants = conversation.participants.filter(
    (p) => p.id !== currentUserId,
  );
  const displayUser = otherParticipants[0];
  const displayName =
    conversation.name ||
    (conversation.isGroup
      ? otherParticipants.map((p) => p.name.split(" ")[0]).join(", ")
      : displayUser?.name);

  const memberCount = Math.max(conversation.participants.length, hasCurrentUser ? 1 : 0);
  const onlineCount =
    conversation.participants.length === 0 && hasCurrentUser
      ? 1
      : otherParticipants.filter((p) => p.status === "online").length;
  const statusText = conversation.isGroup
    ? onlineCount > 0
      ? t("chat_header.members_online", {
          count: memberCount,
          online: onlineCount,
        })
      : t("chat_header.members", { count: memberCount })
    : displayUser?.status === "online"
      ? t("chat_header.online")
      : t("chat_header.offline");

  return (
    <header
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-border bg-card",
        className,
      )}
    >
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden shrink-0 -ml-2"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">{t("chat_header.back_button")}</span>
        </Button>
      )}
      {conversation.isGroup ? (
        <div className="relative h-10 w-10 shrink-0">
          {otherParticipants.length > 0 ? (
            <>
              <UserAvatar
                user={otherParticipants[0]}
                size="sm"
                className="absolute top-0 left-0"
              />
              {otherParticipants[1] && (
                <UserAvatar
                  user={otherParticipants[1]}
                  size="sm"
                  className="absolute rounded-full bottom-0 right-0 ring-2 ring-card"
                />
              )}
            </>
          ) : (
            <UserAvatar
              user={{
                id: "group",
                name: conversation.name || "Chat",
              }}
              size="md"
            />
          )}
        </div>
      ) : (
        <UserAvatar user={displayUser} size="md" showStatus />
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-sm truncate">{displayName}</h1>
        <p className="text-xs text-muted-foreground">{statusText}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMore}
          className="text-muted-foreground hover:text-foreground"
        >
          <MoreVertical className="h-5 w-5" />
          <span className="sr-only">{t("chat_header.more_options")}</span>
        </Button>
      </div>
    </header>
  );
}
