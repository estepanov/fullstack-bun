import type { FESession } from "@frontend/lib/auth-client";
import { MessageInput } from "frontend-common/components/chat/message-input";
import { Alert } from "frontend-common/components/ui";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";

interface EnhancedMessageInputProps {
  onSend: (message: string) => void;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  throttle: {
    remainingMs: number;
    limit: number;
    windowMs: number;
    restoreMessage?: string;
  } | null;
  isAuthenticated: boolean;
  profileIncomplete?: boolean;
  session: FESession | null | undefined;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onTypingStatus?: (isTyping: boolean) => void;
}

export const EnhancedMessageInput = ({
  onSend,
  connectionStatus,
  throttle,
  isAuthenticated,
  profileIncomplete,
  session,
  disabled = false,
  placeholder,
  className,
  onTypingStatus,
}: EnhancedMessageInputProps) => {
  const { t } = useTranslation("messages");
  const throttleSeconds = throttle ? Math.ceil(throttle.remainingMs / 1000) : 0;
  const throttleWindowSeconds = throttle ? Math.ceil(throttle.windowMs / 1000) : 0;
  const isThrottled = Boolean(throttle);
  const messageInputCopy = {
    placeholder: t("form.placeholder"),
    addEmojiLabel: t("message_input.add_emoji"),
    sendMessageLabel: t("message_input.send_message"),
    characterCountLabel: ({
      count,
      max,
    }: {
      count: number;
      max: number;
    }) => t("form.character_count", { count, max }),
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 p-4 text-center shadow-sm dark:border-primary/30 dark:from-primary/10 dark:to-primary/5">
        <p className="text-sm text-foreground">
          <Trans
            i18nKey="form.login_prompt"
            ns="messages"
            components={{
              loginLink: (
                <Link
                  to="/auth/login"
                  className="font-semibold text-primary hover:underline dark:text-primary"
                />
              ),
            }}
          />
        </p>
      </div>
    );
  }

  // Show profile completion prompt if profile is incomplete
  if (profileIncomplete) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-linear-to-br from-amber-50 to-amber-100/50 p-4 text-center shadow-sm dark:border-amber-500/30 dark:from-amber-950/40 dark:to-amber-900/20">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          <Trans
            i18nKey="form.complete_profile_prompt"
            ns="messages"
            components={{
              profileLink: (
                <Link
                  to="/profile/complete"
                  className="font-semibold text-amber-700 hover:underline dark:text-amber-300"
                />
              ),
            }}
          />
        </p>
      </div>
    );
  }

  // Show verification prompt if email not verified
  if (!session?.user?.emailVerified) {
    return (
      <div className="rounded-xl border border-yellow-500/20 bg-linear-to-br from-yellow-50 to-yellow-100/50 p-4 text-center shadow-sm dark:border-yellow-500/30 dark:from-yellow-950/40 dark:to-yellow-900/20">
        <p className="text-sm text-yellow-900 dark:text-yellow-100">
          {t("form.verify_email_prompt")}
        </p>
      </div>
    );
  }

  const isInputDisabled = connectionStatus !== "connected" || disabled || isThrottled;

  return (
    <div className="flex flex-col space-y-2">
      {isThrottled && (
        <Alert variant="info">
          {t("form.throttle_notice", { seconds: throttleSeconds })}
          <span className="ml-1">
            {t("form.throttle_hint", {
              limit: throttle?.limit ?? 0,
              windowSeconds: throttleWindowSeconds,
            })}
          </span>
        </Alert>
      )}
      <MessageInput
        onSend={onSend}
        onTypingStatus={onTypingStatus}
        disabled={isInputDisabled}
        placeholder={placeholder}
        copy={messageInputCopy}
        className={className}
      />
    </div>
  );
};
