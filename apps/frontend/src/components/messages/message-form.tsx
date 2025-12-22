import { Button } from "frontend-common/components/ui";
import { Textarea } from "frontend-common/components/ui";
import type { FESession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ChatWSMessageType, MESSAGE_CONFIG, getSendMessageSchema } from "shared";

interface MessageFormProps {
  sendMessage: (message: string) => boolean;
  isAuthenticated: boolean;
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
  session,
  isAdmin = false,
  connectionStatus,
  throttle,
}: MessageFormProps) => {
  const { t } = useTranslation("messages");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const throttleSeconds = throttle ? Math.ceil(throttle.remainingMs / 1000) : 0;
  const throttleWindowSeconds = throttle
    ? Math.ceil(throttle.windowMs / 1000)
    : 0;
  const isThrottled = Boolean(throttle);

  useEffect(() => {
    if (throttle?.restoreMessage && message.trim() === "") {
      setMessage(throttle.restoreMessage);
    }
  }, [message, throttle?.restoreMessage]);

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border bg-gray-50 p-4 text-center">
        <p className="text-gray-600">
          <Trans
            i18nKey="form.login_prompt"
            ns="messages"
            components={{
              loginLink: (
                <Link to="/auth/login" className="text-blue-600 hover:underline" />
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
      <div className="rounded-lg border bg-yellow-50 p-4 text-center">
        <p className="text-yellow-800">{t("form.verify_email_prompt")}</p>
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

  const isDisabled =
    connectionStatus !== "connected" || !message.trim() || isThrottled;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      {error && (
        <div className="rounded-md bg-red-50 p-2 text-sm text-red-800">{error}</div>
      )}
      {isThrottled && (
        <div className="rounded-md bg-amber-50 p-2 text-sm text-amber-900">
          {t("form.throttle_notice", { seconds: throttleSeconds })}
          <span className="ml-1 text-amber-800">
            {t("form.throttle_hint", {
              limit: throttle?.limit ?? 0,
              windowSeconds: throttleWindowSeconds,
            })}
          </span>
        </div>
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
