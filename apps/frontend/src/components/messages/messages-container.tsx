import { Card } from "@/components/ui/card";
import { useChatWebSocket } from "@/hooks/api/useChatWebSocket";
import { useSession } from "@/lib/auth-client";
import { isAdminSession } from "@/lib/user-role";
import { MessageScrollProvider } from "./message-context";
import { MessageForm } from "./message-form";
import { MessageList } from "./message-list";

export const MessagesContainer = () => {
  const { messages, sendMessage, connectionStatus, error, isAuthenticated } =
    useChatWebSocket();
  const { data } = useSession();
  const isAdmin = isAdminSession(data);

  return (
    <MessageScrollProvider>
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
        <div className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-800">{error}</div>
      )}

      <Card className="p-2 shadow-none">
        <MessageList
          messages={messages}
          currentUserId={data?.user?.id}
          isAdmin={isAdmin}
        />
      </Card>
      <MessageForm
        sendMessage={sendMessage}
        isAuthenticated={isAuthenticated}
        session={data}
        connectionStatus={connectionStatus}
      />
    </MessageScrollProvider>
  );
};
