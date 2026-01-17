import type { Meta, StoryObj } from "@storybook/react";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "frontend-common/components/ui/emoji-picker";
import { useState } from "react";

const meta = {
  title: "UI/EmojiPicker",
  component: EmojiPicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="border rounded-lg overflow-hidden shadow-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmojiPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

    return (
      <div className="space-y-4">
        {selectedEmoji && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Selected emoji:</p>
            <div className="text-4xl">{selectedEmoji}</div>
          </div>
        )}
        <EmojiPicker
          onEmojiSelect={({ emoji }) => {
            console.log("Selected emoji:", emoji);
            setSelectedEmoji(emoji);
          }}
          className="h-[342px] w-[338px]"
        >
          <EmojiPickerSearch />
          <EmojiPickerContent />
          <EmojiPickerFooter />
        </EmojiPicker>
      </div>
    );
  },
};

export const WithSearch: Story = {
  render: () => (
    <EmojiPicker
      onEmojiSelect={({ emoji }) => console.log("Selected emoji:", emoji)}
      className="h-[342px] w-[338px]"
    >
      <EmojiPickerSearch placeholder="Search emojis..." />
      <EmojiPickerContent />
      <EmojiPickerFooter />
    </EmojiPicker>
  ),
};

export const WithCustomFooter: Story = {
  render: () => (
    <EmojiPicker
      onEmojiSelect={({ emoji }) => console.log("Selected emoji:", emoji)}
      className="h-[342px] w-[338px]"
    >
      <EmojiPickerSearch />
      <EmojiPickerContent />
      <EmojiPickerFooter placeholder="Hover over an emoji to preview..." />
    </EmojiPicker>
  ),
};

export const WithCustomEmptyState: Story = {
  render: () => (
    <EmojiPicker
      onEmojiSelect={({ emoji }) => console.log("Selected emoji:", emoji)}
      className="h-[342px] w-[338px]"
    >
      <EmojiPickerSearch placeholder="Try searching for 'zzzzz'..." />
      <EmojiPickerContent emptyStateText="Oops! No emojis match your search." />
      <EmojiPickerFooter />
    </EmojiPicker>
  ),
};

export const Compact: Story = {
  render: () => (
    <EmojiPicker
      onEmojiSelect={({ emoji }) => console.log("Selected emoji:", emoji)}
      className="h-[280px] w-[300px]"
    >
      <EmojiPickerSearch />
      <EmojiPickerContent />
      <EmojiPickerFooter />
    </EmojiPicker>
  ),
};

export const Large: Story = {
  render: () => (
    <EmojiPicker
      onEmojiSelect={({ emoji }) => console.log("Selected emoji:", emoji)}
      className="h-[450px] w-[400px]"
    >
      <EmojiPickerSearch />
      <EmojiPickerContent />
      <EmojiPickerFooter />
    </EmojiPicker>
  ),
};

export const InteractiveDemo: Story = {
  render: () => {
    const [selectedEmojis, setSelectedEmojis] = useState<
      Array<{ id: string; emoji: string }>
    >([]);

    return (
      <div className="space-y-4">
        <div className="min-h-[60px] p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-2">Your emoji collection:</p>
          <div className="text-2xl space-x-1">
            {selectedEmojis.length > 0 ? (
              selectedEmojis.map(({ id, emoji }) => <span key={id}>{emoji}</span>)
            ) : (
              <span className="text-sm text-muted-foreground">
                Click emojis below to add them
              </span>
            )}
          </div>
          {selectedEmojis.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedEmojis([])}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all
            </button>
          )}
        </div>
        <EmojiPicker
          onEmojiSelect={({ emoji }) => {
            setSelectedEmojis((prev) => [
              ...prev,
              {
                id:
                  typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : `${emoji}-${Date.now()}-${prev.length}`,
                emoji,
              },
            ]);
          }}
          className="h-[342px] w-[338px]"
        >
          <EmojiPickerSearch placeholder="Search for emojis..." />
          <EmojiPickerContent />
          <EmojiPickerFooter placeholder="Select an emoji..." />
        </EmojiPicker>
      </div>
    );
  },
};
