import { Send, Smile } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { MESSAGE_CONFIG } from "shared/config/chat";
import { cn } from "../../lib/utils";
import { Alert, Button, Field, FieldContent, FieldDescription, Textarea } from "../ui";
import { EmojiPickerPopover } from "../ui/emoji-picker-popover";

export interface MessageInputCopy {
  placeholder: string;
  addEmojiLabel: string;
  sendMessageLabel: string;
  characterCountLabel: (args: { count: number; max: number }) => string;
  throttleNotice?: (seconds: number) => string;
  throttleHint?: (args: { limit: number; windowSeconds: number }) => string;
}

interface MessageInputProps {
  copy: MessageInputCopy;
  onSend?: (message: string) => void;
  onTypingStatus?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  throttle?: {
    remainingMs: number;
    limit: number;
    windowMs: number;
    restoreMessage?: string;
  } | null;
  className?: string;
}

const TYPING_REFRESH_MS = 3000;

export function MessageInput({
  copy,
  onSend,
  onTypingStatus,
  placeholder,
  disabled = false,
  throttle = null,
  className,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const isTypingRef = useRef(false);
  const lastTypingSentRef = useRef(0);
  const resolvedPlaceholder = placeholder ?? copy.placeholder;

  const throttleSeconds = throttle ? Math.ceil(throttle.remainingMs / 1000) : 0;
  const throttleWindowSeconds = throttle ? Math.ceil(throttle.windowMs / 1000) : 0;
  const isThrottled = Boolean(throttle);

  const handleSubmit = (e: React.SyntheticEvent) => {
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
      className={cn("flex flex-col gap-0 p-4 border-t border-border bg-card", className)}
    >
      {/* Throttle Alert with animation */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isThrottled ? "max-h-32 opacity-100 mb-4" : "max-h-0 opacity-0",
        )}
      >
        {isThrottled && copy.throttleNotice && copy.throttleHint && (
          <Alert variant="info" className="animate-in fade-in slide-in-from-top-2">
            {copy.throttleNotice(throttleSeconds)}
            <span className="ml-1">
              {copy.throttleHint({
                limit: throttle?.limit ?? 0,
                windowSeconds: throttleWindowSeconds,
              })}
            </span>
          </Alert>
        )}
      </div>

      {/* Message Input Area */}
      <div className="flex items-end gap-2">
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
                  <span className="sr-only">{copy.addEmojiLabel}</span>
                </Button>
              </div>
            </EmojiPickerPopover>
          </FieldContent>
          <FieldDescription>
            {copy.characterCountLabel({
              count: value.length,
              max: MESSAGE_CONFIG.MAX_LENGTH,
            })}
          </FieldDescription>
        </Field>
        <Button
          type="submit"
          size="icon"
          className="shrink-0 h-11 w-11 rounded-full mb-8"
          disabled={disabled || isThrottled || !value.trim()}
          onClick={handleSubmit}
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">{copy.sendMessageLabel}</span>
        </Button>
      </div>
    </form>
  );
}
