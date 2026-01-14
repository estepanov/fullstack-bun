import type { User } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui";

interface UserAvatarProps {
  user?: User | null;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const statusClasses = {
  online: "bg-green-500",
  offline: "bg-muted-foreground/50",
  away: "bg-amber-500",
};

export function UserAvatar({
  user,
  size = "md",
  showStatus = false,
  className,
}: UserAvatarProps) {
  const displayName = user?.name?.trim() || "Unknown";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(sizeClasses[size])}>
        <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={displayName} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      {showStatus && user?.status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-card",
            size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
            statusClasses[user.status],
          )}
        />
      )}
    </div>
  );
}
