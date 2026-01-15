import type { Meta, StoryObj } from "@storybook/react";
import { ConversationItem } from "frontend-common/components/chat/conversation-item";
import type { Conversation, Message, User } from "frontend-common/lib/chat-types";

const meta = {
  title: "Chat/ConversationItem",
  component: ConversationItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isActive: {
      control: "boolean",
      description: "Whether the conversation is currently active/selected",
    },
    isAdmin: {
      control: "boolean",
      description: "Whether the current user is an admin",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ConversationItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const currentUser: User = {
  id: "me",
  name: "Me",
  status: "online",
};

const alice: User = {
  id: "1",
  name: "Alice Johnson",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  status: "online",
};

const bob: User = {
  id: "2",
  name: "Bob Smith",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  status: "offline",
};

const charlie: User = {
  id: "3",
  name: "Charlie Brown",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  status: "online",
};

const recentMessage: Message = {
  id: "1",
  content: "Hey! How are you doing?",
  sender: alice,
  timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  status: "read",
};

const ownMessage: Message = {
  id: "2",
  content: "I'm doing great, thanks!",
  sender: currentUser,
  timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  status: "read",
};

const oldMessage: Message = {
  id: "3",
  content: "See you tomorrow!",
  sender: bob,
  timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  status: "read",
};

const oneOnOneConversation: Conversation = {
  id: "1",
  participants: [currentUser, alice],
  lastMessage: recentMessage,
  unreadCount: 3,
  isGroup: false,
};

const oneOnOneConversationNoUnread: Conversation = {
  id: "2",
  participants: [currentUser, bob],
  lastMessage: ownMessage,
  unreadCount: 0,
  isGroup: false,
};

const groupConversation: Conversation = {
  id: "3",
  name: "Team Chat",
  participants: [currentUser, alice, bob, charlie],
  lastMessage: oldMessage,
  unreadCount: 12,
  isGroup: true,
};

const emptyConversation: Conversation = {
  id: "4",
  participants: [currentUser, alice],
  isGroup: false,
};

export const Default: Story = {
  args: {
    conversation: oneOnOneConversation,
    currentUserId: "me",
    onClick: () => console.log("Conversation clicked"),
  },
};

export const Active: Story = {
  args: {
    conversation: oneOnOneConversation,
    currentUserId: "me",
    isActive: true,
    onClick: () => console.log("Conversation clicked"),
  },
};

export const NoUnreadMessages: Story = {
  args: {
    conversation: oneOnOneConversationNoUnread,
    currentUserId: "me",
    onClick: () => console.log("Conversation clicked"),
  },
};

export const GroupChat: Story = {
  args: {
    conversation: groupConversation,
    currentUserId: "me",
    onClick: () => console.log("Conversation clicked"),
  },
};

export const EmptyConversation: Story = {
  args: {
    conversation: emptyConversation,
    currentUserId: "me",
    onClick: () => console.log("Conversation clicked"),
  },
};

export const HighUnreadCount: Story = {
  args: {
    conversation: {
      ...oneOnOneConversation,
      unreadCount: 125,
    },
    currentUserId: "me",
    onClick: () => console.log("Conversation clicked"),
  },
};

export const WithActions: Story = {
  args: {
    conversation: oneOnOneConversationNoUnread,
    currentUserId: "me",
    onClick: () => console.log("Conversation clicked"),
    onEditMessage: (msg, conv) => console.log("Edit message:", msg, "in", conv),
    onDeleteMessage: (msg, conv) => console.log("Delete message:", msg, "in", conv),
  },
};

export const AdminWithBanAction: Story = {
  args: {
    conversation: oneOnOneConversation,
    currentUserId: "me",
    isAdmin: true,
    onClick: () => console.log("Conversation clicked"),
    onEditMessage: (msg, conv) => console.log("Edit message:", msg, "in", conv),
    onDeleteMessage: (msg, conv) => console.log("Delete message:", msg, "in", conv),
    onBanUser: (user, conv) => console.log("Ban user:", user, "from", conv),
  },
};

export const ConversationList: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-1 p-2 bg-card border rounded-lg">
      <ConversationItem
        conversation={oneOnOneConversation}
        currentUserId="me"
        isActive={true}
        onClick={() => console.log("Clicked conversation 1")}
      />
      <ConversationItem
        conversation={groupConversation}
        currentUserId="me"
        onClick={() => console.log("Clicked conversation 2")}
      />
      <ConversationItem
        conversation={oneOnOneConversationNoUnread}
        currentUserId="me"
        onClick={() => console.log("Clicked conversation 3")}
      />
      <ConversationItem
        conversation={emptyConversation}
        currentUserId="me"
        onClick={() => console.log("Clicked conversation 4")}
      />
    </div>
  ),
};
