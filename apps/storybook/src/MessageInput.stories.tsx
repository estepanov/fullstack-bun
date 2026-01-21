import type { Meta, StoryObj } from "@storybook/react";
import { MessageInput } from "frontend-common/components/chat/message-input";
import type { MessageInputCopy } from "frontend-common/components/chat/message-input";
import { useState } from "react";

const meta = {
  title: "Chat/MessageInput",
  component: MessageInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text for the input",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MessageInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultCopy: MessageInputCopy = {
  placeholder: "Type a message...",
  addEmojiLabel: "Add emoji",
  sendMessageLabel: "Send message",
  characterCountLabel: ({ count, max }) => `${count}/${max} characters`,
};

export const Default: Story = {
  args: {
    onSend: (message) => console.log("Send message:", message),
    onTypingStatus: (isTyping) => console.log("Typing status:", isTyping),
    copy: defaultCopy,
  },
};

export const WithPlaceholder: Story = {
  args: {
    onSend: (message) => console.log("Send message:", message),
    placeholder: "Type your message here...",
    copy: defaultCopy,
  },
};

export const Disabled: Story = {
  args: {
    onSend: (message) => console.log("Send message:", message),
    disabled: true,
    copy: defaultCopy,
  },
};

export const WithTypingIndicator: Story = {
  render: () => {
    const [isTyping, setIsTyping] = useState(false);

    return (
      <div className="space-y-2">
        {isTyping && (
          <div className="text-xs text-muted-foreground px-4">You are typing...</div>
        )}
        <MessageInput
          onSend={(message) => {
            console.log("Send message:", message);
            setIsTyping(false);
          }}
          onTypingStatus={setIsTyping}
          copy={defaultCopy}
        />
      </div>
    );
  },
};

export const InChatContext: Story = {
  render: () => {
    const [messages, setMessages] = useState(() => [
      { id: "1", text: "Hello!" },
      { id: "2", text: "How are you?" },
      { id: "3", text: "I'm doing great, thanks!" },
    ]);

    return (
      <div className="w-full max-w-2xl border rounded-lg overflow-hidden">
        <div className="p-4 space-y-2 bg-background min-h-[300px]">
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] ${
                idx % 2 === 0
                  ? "bg-card border border-border rounded-bl-md mr-auto"
                  : "bg-primary text-primary-foreground rounded-br-md ml-auto"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <MessageInput
          onSend={(message) => {
            setMessages((prev) => [
              ...prev,
              {
                id:
                  typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}-${prev.length}`,
                text: message,
              },
            ]);
          }}
          copy={defaultCopy}
        />
      </div>
    );
  },
};
