import type React from "react";

import { Send, Smile } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MESSAGE_CONFIG } from "shared/config/chat";
import { cn } from "../../lib/utils";
import { Button, Field, FieldContent, FieldDescription, Textarea } from "../ui";
import { EmojiPickerPopover } from "../ui/emoji-picker-popover";

interface MessageInputProps {
  onSend?: (message: string) => void;
  onTypingStatus?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const TYPING_REFRESH_MS = 3000;

export function MessageInput({
  onSend,
  onTypingStatus,
  placeholder,
  disabled = false,
  className,
}: MessageInputProps) {
  const { t } = useTranslation("messages");
  const [value, setValue] = useState("");
  const isTypingRef = useRef(false);
  const lastTypingSentRef = useRef(0);
  const resolvedPlaceholder = placeholder ?? t("message_input.placeholder");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && onSend) {
      onSend(value.trim());
      setValue("");
      if (isTypingRef.current && onTypingStatus) {
        onTypingStatus(false);
        isTypingRef.current = false;
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-end gap-2 p-4 border-t border-border bg-card",
        className,
      )}
    >
      <Field className="w-full">
        <FieldContent className="relative">
          <Textarea
            value={value}
            onChange={(e) => {
              const nextValue = e.target.value;
              setValue(nextValue);

              if (!onTypingStatus) {
                return;
              }

              const hasText = nextValue.trim().length > 0;
              const now = Date.now();

              if (hasText) {
                if (
                  !isTypingRef.current ||
                  now - lastTypingSentRef.current >= TYPING_REFRESH_MS
                ) {
                  onTypingStatus(true);
                  isTypingRef.current = true;
                  lastTypingSentRef.current = now;
                }
              } else if (isTypingRef.current) {
                onTypingStatus(false);
                isTypingRef.current = false;
              }
            }}
            placeholder={resolvedPlaceholder}
            disabled={disabled}
            rows={1}
            maxLength={MESSAGE_CONFIG.MAX_LENGTH}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            onBlur={() => {
              if (isTypingRef.current && onTypingStatus) {
                onTypingStatus(false);
                isTypingRef.current = false;
              }
            }}
          />
          <EmojiPickerPopover
            side="top"
            onEmojiSelect={(emoji) => {
              setValue(value + emoji);
            }}
          >
            <div className="absolute right-2 bottom-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full bg-background h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-all ease-in-out duration-150 opacity-80 hover:opacity-100",
                  disabled ? "opacity-50 cursor-not-allowed" : "",
                )}
                disabled={disabled}
              >
                <Smile className="h-5 w-5" />
                <span className="sr-only">{t("message_input.add_emoji")}</span>
              </Button>
            </div>
          </EmojiPickerPopover>
        </FieldContent>
        <FieldDescription>
          {t("form.character_count", {
            count: value.length,
            max: MESSAGE_CONFIG.MAX_LENGTH,
          })}
        </FieldDescription>
      </Field>
      <Button
        type="submit"
        size="icon"
        className="shrink-0 h-11 w-11 rounded-full mb-8"
        disabled={disabled || !value.trim()}
      >
        <Send className="h-5 w-5" />
        <span className="sr-only">{t("message_input.send_message")}</span>
      </Button>
    </form>
  );
}
