import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGE_CONFIG } from "@/config/messages";
import type { FESession } from "@/lib/auth-client";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";

interface MessageFormProps {
  sendMessage: (message: string) => void;
  isAuthenticated: boolean;
  session: FESession | null | undefined;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
}

export const MessageForm = ({
  sendMessage,
  isAuthenticated,
  session,
  connectionStatus,
}: MessageFormProps) => {
  const { t } = useTranslation("messages");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

    // Validate message
    if (!message.trim()) {
      setError(t("form.errors.empty"));
      return;
    }

    if (message.length > MESSAGE_CONFIG.MAX_LENGTH) {
      setError(t("form.errors.max_length", { max: MESSAGE_CONFIG.MAX_LENGTH }));
      return;
    }

    // Send message
    sendMessage(message);
    setMessage("");
    setError("");
  };

  const isDisabled = connectionStatus !== "connected" || !message.trim();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      {error && (
        <div className="rounded-md bg-red-50 p-2 text-sm text-red-800">{error}</div>
      )}
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            // Submit on Enter (without Shift)
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={t("form.placeholder")}
          className="rounded-xl resize-none"
          rows={MESSAGE_CONFIG.DEFAULT_ROWS}
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
