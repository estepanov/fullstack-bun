import type { Meta, StoryObj } from "@storybook/react";
import { ChatHeader } from "frontend-common/components/chat/chat-header";
import type { Conversation, User } from "frontend-common/lib/chat-types";

const meta = {
  title: "Chat/ChatHeader",
  component: ChatHeader,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatHeader>;

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

const oneOnOneConversation: Conversation = {
  id: "1",
  participants: [currentUser, alice],
  isGroup: false,
};

const groupConversation: Conversation = {
  id: "2",
  name: "Team Chat",
  participants: [currentUser, alice, bob, charlie],
  isGroup: true,
};

const oneOnOneOfflineConversation: Conversation = {
  id: "3",
  participants: [currentUser, bob],
  isGroup: false,
};

export const OneOnOneOnline: Story = {
  args: {
    conversation: oneOnOneConversation,
    currentUserId: "me",
    onBack: () => console.log("Back clicked"),
    onMore: () => console.log("More clicked"),
  },
};

export const OneOnOneOffline: Story = {
  args: {
    conversation: oneOnOneOfflineConversation,
    currentUserId: "me",
    onBack: () => console.log("Back clicked"),
    onMore: () => console.log("More clicked"),
  },
};

export const GroupChat: Story = {
  args: {
    conversation: groupConversation,
    currentUserId: "me",
    onBack: () => console.log("Back clicked"),
    onMore: () => console.log("More clicked"),
  },
};

export const WithoutBackButton: Story = {
  args: {
    conversation: oneOnOneConversation,
    currentUserId: "me",
    onMore: () => console.log("More clicked"),
  },
};

export const InChatContext: Story = {
  args: {
    conversation: oneOnOneConversation,
    currentUserId: "me",
    onBack: () => console.log("Back clicked"),
    onMore: () => console.log("More clicked"),
  },
  render: (args) => (
    <div className="w-full max-w-2xl border rounded-lg overflow-hidden">
      <ChatHeader
        conversation={args.conversation}
        currentUserId={args.currentUserId}
        onBack={args.onBack}
        onMore={args.onMore}
      />
      <div className="p-4 bg-background min-h-[300px] space-y-4">
        <div className="px-4 py-2.5 rounded-2xl text-sm max-w-[85%] bg-card border border-border rounded-bl-md">
          Hey! How are you?
        </div>
        <div className="px-4 py-2.5 rounded-2xl text-sm max-w-[85%] bg-primary text-primary-foreground rounded-br-md ml-auto">
          I'm doing great, thanks!
        </div>
      </div>
    </div>
  ),
};

export const GroupChatInContext: Story = {
  args: {
    conversation: groupConversation,
    currentUserId: "me",
    onBack: () => console.log("Back clicked"),
    onMore: () => console.log("More clicked"),
  },
  render: (args) => (
    <div className="w-full max-w-2xl border rounded-lg overflow-hidden">
      <ChatHeader
        conversation={args.conversation}
        currentUserId={args.currentUserId}
        onBack={args.onBack}
        onMore={args.onMore}
      />
      <div className="p-4 bg-background min-h-[300px] space-y-4">
        <div className="flex gap-2.5 max-w-[85%] mr-auto">
          <div className="flex flex-col gap-1 items-start">
            <span className="text-xs font-medium text-muted-foreground px-1">Alice</span>
            <div className="px-4 py-2.5 rounded-2xl text-sm bg-card border border-border rounded-bl-md">
              Welcome everyone!
            </div>
          </div>
        </div>
        <div className="flex gap-2.5 max-w-[85%] mr-auto">
          <div className="flex flex-col gap-1 items-start">
            <span className="text-xs font-medium text-muted-foreground px-1">
              Charlie
            </span>
            <div className="px-4 py-2.5 rounded-2xl text-sm bg-card border border-border rounded-bl-md">
              Thanks for having us!
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};
