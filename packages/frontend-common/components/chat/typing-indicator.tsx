import { useTranslation } from "react-i18next";
import type { User } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import { UserAvatar } from "../ui/user-avatar";

interface TypingIndicatorProps {
  users: User[];
  className?: string;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  const { t } = useTranslation("messages");
  if (users.length === 0) return null;

  const typingText =
    users.length === 1
      ? t("typing.single", { name: users[0].name })
      : users.length === 2
        ? t("typing.two", { first: users[0].name, second: users[1].name })
        : t("typing.many", { name: users[0].name, count: users.length - 1 });

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user) => (
          <UserAvatar
            key={user.id}
            user={user}
            size="sm"
            className="ring-2 ring-background"
          />
        ))}
      </div>
      <div className="flex items-center gap-2 bg-card border border-border rounded-2xl rounded-bl-md px-4 py-2.5">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
        </div>
        <span className="text-xs text-muted-foreground">{typingText}</span>
      </div>
    </div>
  );
}
