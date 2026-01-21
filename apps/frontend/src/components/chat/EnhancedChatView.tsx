import type { FESession } from "@frontend/lib/auth-client";
import { ChatHeader } from "frontend-common/components/chat/chat-header";
import { Card } from "frontend-common/components/ui";
import type { Conversation, Message, User } from "frontend-common/lib/chat-types";
import { useTranslation } from "react-i18next";
import type { ChatMessage } from "shared";
import { ConnectionStatusHeader } from "./ConnectionStatusHeader";
import { EnhancedMessageInput } from "./EnhancedMessageInput";
import { EnhancedMessageList } from "./EnhancedMessageList";

interface EnhancedChatViewProps {
  conversation: Conversation;
  messages: Message[];
  chatMessages: ChatMessage[]; // Original messages for admin operations
  currentUserId: string;
  isAdmin?: boolean;
  typingUsers?: User[];
  onSendMessage: (message: string) => void;
  onTypingStatus?: (isTyping: boolean) => void;
  onBack?: () => void;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  error: string | null;
  isAuthenticated: boolean;
  profileIncomplete?: boolean;
  session: FESession | null | undefined;
  throttle: {
    remainingMs: number;
    limit: number;
    windowMs: number;
    restoreMessage?: string;
  } | null;
  onlineCounts?: { guests: number; members: number; admins: number } | null;
  className?: string;
}

export const EnhancedChatView = ({
  conversation,
  messages,
  chatMessages,
  currentUserId,
  isAdmin = false,
  typingUsers = [],
  onSendMessage,
  onTypingStatus,
  onBack,
  connectionStatus,
  error,
  isAuthenticated,
  profileIncomplete,
  session,
  throttle,
  onlineCounts,
  className,
}: EnhancedChatViewProps) => {
  const { t } = useTranslation("messages");
  const chatHeaderCopy = {
    backButtonLabel: t("chat_header.back_button"),
    moreOptionsLabel: t("chat_header.more_options"),
    onlineLabel: t("chat_header.online"),
    offlineLabel: t("chat_header.offline"),
    membersLabel: (count: number) => t("chat_header.members", { count }),
    membersOnlineLabel: (count: number, online: number) =>
      t("chat_header.members_online", { count, online }),
    groupFallbackName: t("chat_header.group_fallback_name"),
  };
  const hasMessages = messages.length > 0;
  const isLoading = connectionStatus === "connecting" && !hasMessages;
  const isEmpty = connectionStatus === "connected" && !hasMessages && !error;

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      {/* Chat Header */}
      <ChatHeader
        conversation={conversation}
        currentUserId={currentUserId}
        copy={chatHeaderCopy}
        onBack={onBack}
      />

      {/* Connection Status */}
      <ConnectionStatusHeader
        connectionStatus={connectionStatus}
        error={error}
        onlineCounts={onlineCounts}
        className="px-4 pt-2"
      />

      {/* Messages Area */}
      <Card className="relative m-4 flex-1 p-2 shadow-none overflow-hidden">
        {/* Loading State */}
        <div
          className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 ${
            isLoading ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/40" />
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

        {/* Content */}
        <div
          className={`transition-opacity duration-500 h-full flex flex-col ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Empty State */}
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

          {/* Skeleton State (connecting but no messages) */}
          {!isEmpty && !hasMessages && (
            <div className="space-y-3">
              {["first", "second", "third", "fourth"].map((rowId, index) => (
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

          {/* Messages List */}
          {hasMessages && (
            <EnhancedMessageList
              messages={messages}
              chatMessages={chatMessages}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              typingUsers={typingUsers}
            />
          )}
        </div>
      </Card>

      {/* Message Input */}
      <div className="px-4 pb-4">
        <EnhancedMessageInput
          onSend={onSendMessage}
          onTypingStatus={onTypingStatus}
          connectionStatus={connectionStatus}
          throttle={throttle}
          isAuthenticated={isAuthenticated}
          profileIncomplete={profileIncomplete}
          session={session}
        />
      </div>
    </div>
  );
};
