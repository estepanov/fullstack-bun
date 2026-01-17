"use client";

import * as React from "react";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "./emoji-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export const EmojiPickerPopover = ({
  side,
  children,
  onEmojiSelect,
}: {
  side?: "left" | "right" | "top" | "bottom";
  children: React.ReactNode;
  onEmojiSelect: (emoji: string) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen} modal={false}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side={side} className="h-85.5 w-fit p-0">
        <EmojiPicker
          onEmojiSelect={({ emoji }) => {
            setIsOpen(false);
            onEmojiSelect(emoji);
          }}
        >
          <EmojiPickerSearch />
          <EmojiPickerContent />
          <EmojiPickerFooter />
        </EmojiPicker>
      </PopoverContent>
    </Popover>
  );
};
