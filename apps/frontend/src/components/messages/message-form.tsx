import type { FESession } from "@/lib/auth-client";
import { Alert, Button, InputError, Textarea } from "frontend-common/components/ui";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ChatWSMessageType, MESSAGE_CONFIG, getSendMessageSchema } from "shared";

interface MessageFormProps {
  sendMessage: (message: string) => boolean;
  isAuthenticated: boolean;
  profileIncomplete?: boolean;
  session: FESession | null | undefined;
  isAdmin?: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  throttle: {
    remainingMs: number;
    limit: number;
    windowMs: number;
    restoreMessage?: string;
  } | null;
}

export const MessageForm = ({
  sendMessage,
  isAuthenticated,
  profileIncomplete,
  session,
  isAdmin = false,
  connectionStatus,
  throttle,
}: MessageFormProps) => {
  const { t } = useTranslation("messages");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const throttleSeconds = throttle ? Math.ceil(throttle.remainingMs / 1000) : 0;
  const throttleWindowSeconds = throttle ? Math.ceil(throttle.windowMs / 1000) : 0;
  const isThrottled = Boolean(throttle);

  useEffect(() => {
    if (throttle?.restoreMessage && message.trim() === "") {
      setMessage(throttle.restoreMessage);
    }
  }, [message, throttle?.restoreMessage]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isThrottled) {
      return;
    }

    // Validate message
    const validation = getSendMessageSchema({
      allowNewlines: isAdmin,
    }).safeParse({
      type: ChatWSMessageType.SEND_MESSAGE,
      message,
    });

    if (!validation.success) {
      const issues = validation.error.issues;
      if (issues.some((issue) => issue.message === "Message must be a single line")) {
        setError(t("form.errors.single_line"));
        return;
      }
      if (issues.some((issue) => issue.code === "too_small")) {
        setError(t("form.errors.empty"));
        return;
      }
      if (issues.some((issue) => issue.code === "too_big")) {
        setError(t("form.errors.max_length", { max: MESSAGE_CONFIG.MAX_LENGTH }));
        return;
      }
      if (issues.some((issue) => issue.message === "Message cannot contain HTML tags")) {
        setError(t("form.errors.no_html"));
        return;
      }
      setError(t("form.errors.invalid"));
      return;
    }

    // Send message
    const didSend = sendMessage(message);
    if (didSend) {
      setMessage("");
      setError("");
    }
  };

  const isDisabled = connectionStatus !== "connected" || !message.trim() || isThrottled;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      {error && <Alert variant="destructive">{error}</Alert>}
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
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => {
            const nextValue = isAdmin
              ? e.target.value
              : e.target.value.replace(/[\r\n]+/g, " ");
            setMessage(nextValue);
            if (error) setError("");
          }}
          onKeyDown={(e) => {
            // Submit on Enter (without Shift)
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
            if (!isAdmin && e.key === "Enter" && e.shiftKey) {
              e.preventDefault();
            }
          }}
          placeholder={t("form.placeholder")}
          className="rounded-xl resize-none"
          rows={isAdmin ? MESSAGE_CONFIG.DEFAULT_ROWS : 1}
          maxLength={MESSAGE_CONFIG.MAX_LENGTH}
          disabled={connectionStatus !== "connected"}
        />
        <Button type="submit" disabled={isDisabled} className="rounded-xl self-end">
          {t("form.send_button")}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {t("form.character_count", {
          count: message.length,
          max: MESSAGE_CONFIG.MAX_LENGTH,
        })}
      </div>
    </form>
  );
};
