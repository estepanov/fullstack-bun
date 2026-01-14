import { Alert } from "frontend-common/components/ui";

interface ConnectionStatusHeaderProps {
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  error: string | null;
  onlineCounts?: { guests: number; members: number; admins: number } | null;
  className?: string;
}

export const ConnectionStatusHeader = ({
  connectionStatus,
  error,
  onlineCounts,
  className,
}: ConnectionStatusHeaderProps) => {
  const totalOnline = onlineCounts
    ? onlineCounts.guests + onlineCounts.members + onlineCounts.admins
    : 0;

  return (
    <div className={className}>
      {/* Connection status indicator */}
      {connectionStatus !== "connected" && (
        <div className="mb-2 text-sm text-muted-foreground flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              connectionStatus === "connecting"
                ? "bg-yellow-500 animate-pulse"
                : connectionStatus === "error"
                  ? "bg-red-500"
                  : "bg-gray-400"
            }`}
          />
          {connectionStatus === "connecting" && "Connecting..."}
          {connectionStatus === "disconnected" && "Disconnected"}
          {connectionStatus === "error" && "Connection error"}
        </div>
      )}

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mb-2">
          {error}
        </Alert>
      )}

      {/* Online count badge (optional, for global chat) */}
      {connectionStatus === "connected" && onlineCounts && totalOnline > 0 && (
        <div className="mb-2 text-xs text-muted-foreground flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>{totalOnline} online</span>
        </div>
      )}
    </div>
  );
};
