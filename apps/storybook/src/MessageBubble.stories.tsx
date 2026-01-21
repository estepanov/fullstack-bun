import type { Meta, StoryObj } from "@storybook/react";
import { MessageBubble } from "frontend-common/components/chat/message-bubble";
import type { MessageBubbleCopy } from "frontend-common/components/chat/message-bubble";
import type { Message, User } from "frontend-common/lib/chat-types";

const meta = {
  title: "Chat/MessageBubble",
  component: MessageBubble,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isOwn: {
      control: "boolean",
      description: "Whether the message is from the current user",
    },
    isAdmin: {
      control: "boolean",
      description: "Whether the current user is an admin",
    },
    showAvatar: {
      control: "boolean",
      description: "Whether to show the sender's avatar",
    },
    showTimestamp: {
      control: "boolean",
      description: "Whether to show the message timestamp",
    },
  },
} satisfies Meta<typeof MessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

const sender: User = {
  id: "1",
  name: "Alice Johnson",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  status: "online",
};

const currentUser: User = {
  id: "2",
  name: "You",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=You",
  status: "online",
};

const message: Message = {
  id: "1",
  content: "Hey! How are you doing today?",
  sender: sender,
  timestamp: new Date(),
  status: "read",
};

const ownMessage: Message = {
  id: "2",
  content: "I'm doing great, thanks for asking!",
  sender: currentUser,
  timestamp: new Date(),
  status: "delivered",
};

const longMessage: Message = {
  id: "3",
  content:
    "This is a longer message to demonstrate how the message bubble handles text wrapping. It should wrap nicely and maintain good readability even with longer content. The message bubble should expand to accommodate the text while staying within the maximum width.",
  sender: sender,
  timestamp: new Date(),
  status: "read",
};

const messageBubbleCopy: MessageBubbleCopy = {
  menuLabel: "Message actions",
  editLabel: "Edit message",
  deleteLabel: "Delete message",
  banUserLabel: "Ban user",
};

export const Default: Story = {
  args: {
    message: message,
    isOwn: false,
    showAvatar: true,
    showTimestamp: true,
    copy: messageBubbleCopy,
  },
};

export const OwnMessage: Story = {
  args: {
    message: ownMessage,
    isOwn: true,
    showAvatar: true,
    showTimestamp: true,
    copy: messageBubbleCopy,
  },
};

export const WithoutAvatar: Story = {
  args: {
    message: message,
    isOwn: false,
    showAvatar: false,
    showTimestamp: true,
    copy: messageBubbleCopy,
  },
};

export const WithoutTimestamp: Story = {
  args: {
    message: message,
    isOwn: false,
    showAvatar: true,
    showTimestamp: false,
    copy: messageBubbleCopy,
  },
};

export const SendingStatus: Story = {
  args: {
    message: {
      ...ownMessage,
      status: "sending",
    },
    isOwn: true,
    showAvatar: true,
    showTimestamp: true,
    copy: messageBubbleCopy,
  },
};

export const SentStatus: Story = {
  args: {
    message: {
      ...ownMessage,
      status: "sent",
    },
    isOwn: true,
    showAvatar: true,
    showTimestamp: true,
    copy: messageBubbleCopy,
  },
};

export const DeliveredStatus: Story = {
  args: {
    message: {
      ...ownMessage,
      status: "delivered",
    },
    isOwn: true,
    showAvatar: true,
    showTimestamp: true,
    copy: messageBubbleCopy,
  },
};

export const ReadStatus: Story = {
  args: {
    message: {
      ...ownMessage,
      status: "read",
    },
    isOwn: true,
    showAvatar: true,
    showTimestamp: true,
    copy: messageBubbleCopy,
  },
};

export const LongMessage: Story = {
  args: {
    message: longMessage,
    isOwn: false,
    showAvatar: true,
    showTimestamp: true,
    copy: messageBubbleCopy,
  },
};

export const WithActions: Story = {
  args: {
    message: ownMessage,
    isOwn: true,
    showAvatar: true,
    showTimestamp: true,
    onEditMessage: (msg) => console.log("Edit message:", msg),
    onDeleteMessage: (msg) => console.log("Delete message:", msg),
    copy: messageBubbleCopy,
  },
};

export const AdminActions: Story = {
  args: {
    message: message,
    isOwn: false,
    isAdmin: true,
    showAvatar: true,
    showTimestamp: true,
    onEditMessage: (msg) => console.log("Edit message:", msg),
    onDeleteMessage: (msg) => console.log("Delete message:", msg),
    onBanUser: (user) => console.log("Ban user:", user),
    copy: messageBubbleCopy,
  },
};

export const Conversation: Story = {
  args: {
    message,
    isOwn: false,
    showAvatar: true,
    showTimestamp: true,
    copy: messageBubbleCopy,
  },
  render: (args) => (
    <div className="flex flex-col gap-4 w-full max-w-2xl p-4">
      <MessageBubble {...args} />
      <MessageBubble {...args} message={ownMessage} isOwn />
      <MessageBubble
        {...args}
        message={{
          ...message,
          id: "4",
          content: "That's wonderful to hear!",
          timestamp: new Date(),
        }}
        isOwn={false}
      />
      <MessageBubble
        {...args}
        message={{
          ...ownMessage,
          id: "5",
          content: "Yeah, it's been a productive day.",
          timestamp: new Date(),
        }}
        isOwn
      />
    </div>
  ),
};
