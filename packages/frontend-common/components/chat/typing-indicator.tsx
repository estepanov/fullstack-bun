import type { User } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import { UserAvatar } from "../ui/user-avatar";

export interface TypingIndicatorCopy {
  typingText: (users: User[]) => string;
}

interface TypingIndicatorProps {
  users: User[];
  copy: TypingIndicatorCopy;
  className?: string;
}

export function TypingIndicator({ users, copy, className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const typingText = copy.typingText(users);

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
