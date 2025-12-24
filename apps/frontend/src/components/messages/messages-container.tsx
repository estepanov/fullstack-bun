import { Card } from "frontend-common/components/ui";
import type { UseChatWebSocketReturn } from "@/hooks/api/useChatWebSocket";
import { useSession } from "@/lib/auth-client";
import { isAdminSession } from "frontend-common/auth";
import { useTranslation } from "react-i18next";
import { MessageScrollProvider } from "./message-context";
import { MessageForm } from "./message-form";
import { MessageList } from "./message-list";

type MessagesContainerProps = Pick<
  UseChatWebSocketReturn,
  | "messages"
  | "sendMessage"
  | "connectionStatus"
  | "error"
  | "isAuthenticated"
  | "throttle"
>;

export const MessagesContainer = ({
  messages,
  sendMessage,
  connectionStatus,
  error,
  isAuthenticated,
  throttle,
}: MessagesContainerProps) => {
  const { t } = useTranslation("messages");
  const { data } = useSession();
  const isAdmin = isAdminSession(data);
  const hasMessages = messages.length > 0;
  const isLoading = connectionStatus === "connecting" && !hasMessages;
  const isEmpty = connectionStatus === "connected" && !hasMessages && !error;
  const skeletonRows = ["first", "second", "third", "fourth"];

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

      <Card className="relative p-2 shadow-none overflow-hidden">
        <div
          className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 ${
            isLoading ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.12),transparent_60%)]" />
          <div className="relative z-10 flex h-full items-center justify-center p-6">
            <div className="w-full max-w-sm text-center">
              <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-amber-200/70 animate-pulse dark:bg-amber-300/20" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("states.loading.title")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("states.loading.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`transition-opacity duration-500 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
        >
          {isEmpty && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 p-8 text-center dark:border-slate-700/60 dark:bg-slate-900/70">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {t("states.empty.title")}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t("states.empty.subtitle")}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm dark:bg-slate-100 dark:text-slate-900">
                {t("states.empty.cta")}
              </div>
            </div>
          )}
          {!isEmpty && !hasMessages && (
            <div className="space-y-3">
              {skeletonRows.map((rowId, index) => (
                <div
                  key={rowId}
                  className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`h-12 w-4/5 rounded-2xl bg-slate-100 animate-pulse dark:bg-slate-800/70 ${
                      index % 2 === 0 ? "rounded-bl-md" : "rounded-br-md"
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
          {hasMessages && (
            <MessageList
              messages={messages}
              currentUserId={data?.user?.id}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </Card>
      <MessageForm
        sendMessage={sendMessage}
        isAuthenticated={isAuthenticated}
        session={data}
        isAdmin={isAdmin}
        connectionStatus={connectionStatus}
        throttle={throttle}
      />
    </MessageScrollProvider>
  );
};
