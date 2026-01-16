import type { Meta, StoryObj } from "@storybook/react";
import { EmojiPickerPopover } from "frontend-common/components/ui/emoji-picker-popover";
import { Button } from "frontend-common/components/ui/button";
import { SmileIcon } from "lucide-react";
import { useState } from "react";

const meta = {
  title: "UI/EmojiPickerPopover",
  component: EmojiPickerPopover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    side: {
      control: "select",
      options: ["left", "right", "top", "bottom"],
      description: "The side of the trigger to display the popover",
    },
  },
} satisfies Meta<typeof EmojiPickerPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

    return (
      <div className="space-y-4">
        <EmojiPickerPopover onEmojiSelect={setSelectedEmoji}>
          <Button variant="outline" size="icon">
            <SmileIcon className="size-4" />
          </Button>
        </EmojiPickerPopover>
        {selectedEmoji && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Selected emoji:</p>
            <div className="text-4xl">{selectedEmoji}</div>
          </div>
        )}
      </div>
    );
  },
};

export const WithTextButton: Story = {
  render: () => {
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

    return (
      <div className="space-y-4">
        <EmojiPickerPopover onEmojiSelect={setSelectedEmoji}>
          <Button variant="outline">
            <SmileIcon className="size-4 mr-2" />
            Add Emoji
          </Button>
        </EmojiPickerPopover>
        {selectedEmoji && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">You selected:</p>
            <div className="text-4xl">{selectedEmoji}</div>
          </div>
        )}
      </div>
    );
  },
};

export const PositionLeft: Story = {
  render: () => (
    <EmojiPickerPopover side="left" onEmojiSelect={(emoji) => console.log(emoji)}>
      <Button variant="outline" size="icon">
        <SmileIcon className="size-4" />
      </Button>
    </EmojiPickerPopover>
  ),
};

export const PositionRight: Story = {
  render: () => (
    <EmojiPickerPopover side="right" onEmojiSelect={(emoji) => console.log(emoji)}>
      <Button variant="outline" size="icon">
        <SmileIcon className="size-4" />
      </Button>
    </EmojiPickerPopover>
  ),
};

export const PositionTop: Story = {
  render: () => (
    <EmojiPickerPopover side="top" onEmojiSelect={(emoji) => console.log(emoji)}>
      <Button variant="outline" size="icon">
        <SmileIcon className="size-4" />
      </Button>
    </EmojiPickerPopover>
  ),
};

export const PositionBottom: Story = {
  render: () => (
    <EmojiPickerPopover side="bottom" onEmojiSelect={(emoji) => console.log(emoji)}>
      <Button variant="outline" size="icon">
        <SmileIcon className="size-4" />
      </Button>
    </EmojiPickerPopover>
  ),
};

export const InMessageInput: Story = {
  render: () => {
    const [message, setMessage] = useState("");

    return (
      <div className="w-full max-w-md space-y-4">
        <div className="min-h-[60px] p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-2">Message preview:</p>
          <div className="text-sm">
            {message || (
              <span className="text-muted-foreground">Start typing or add emojis...</span>
            )}
          </div>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-h-[80px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <EmojiPickerPopover
            side="top"
            onEmojiSelect={(emoji) => setMessage((prev) => prev + emoji)}
          >
            <Button variant="outline" size="icon" className="shrink-0">
              <SmileIcon className="size-4" />
            </Button>
          </EmojiPickerPopover>
        </div>
      </div>
    );
  },
};

export const MultipleEmojiSelection: Story = {
  render: () => {
    const [emojis, setEmojis] = useState<string[]>([]);

    return (
      <div className="w-full max-w-md space-y-4">
        <div className="min-h-[60px] p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-2">Selected emojis:</p>
          <div className="text-2xl space-x-1">
            {emojis.length > 0 ? (
              emojis.map((emoji, idx) => <span key={idx}>{emoji}</span>)
            ) : (
              <span className="text-sm text-muted-foreground">
                Click the button to add emojis
              </span>
            )}
          </div>
          {emojis.length > 0 && (
            <button
              onClick={() => setEmojis([])}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all
            </button>
          )}
        </div>
        <EmojiPickerPopover onEmojiSelect={(emoji) => setEmojis((prev) => [...prev, emoji])}>
          <Button variant="outline">
            <SmileIcon className="size-4 mr-2" />
            Add Emoji ({emojis.length})
          </Button>
        </EmojiPickerPopover>
      </div>
    );
  },
};

export const WithCustomTrigger: Story = {
  render: () => {
    const [selectedEmoji, setSelectedEmoji] = useState<string>("😊");

    return (
      <div className="space-y-4">
        <EmojiPickerPopover onEmojiSelect={setSelectedEmoji}>
          <button className="group flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors">
            <span className="text-2xl">{selectedEmoji}</span>
            <span className="text-sm text-muted-foreground group-hover:text-foreground">
              Click to change
            </span>
          </button>
        </EmojiPickerPopover>
      </div>
    );
  },
};
