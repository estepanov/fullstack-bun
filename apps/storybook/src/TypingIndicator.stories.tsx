import type { Meta, StoryObj } from "@storybook/react";
import { TypingIndicator } from "frontend-common/components/chat/typing-indicator";
import type { TypingIndicatorCopy } from "frontend-common/components/chat/typing-indicator";
import type { User } from "frontend-common/lib/chat-types";

const meta = {
  title: "Chat/TypingIndicator",
  component: TypingIndicator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TypingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

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
  status: "online",
};

const charlie: User = {
  id: "3",
  name: "Charlie Brown",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  status: "online",
};

const david: User = {
  id: "4",
  name: "David Lee",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
  status: "online",
};

const typingCopy: TypingIndicatorCopy = {
  typingText: (users) => {
    if (users.length === 1) return `${users[0]?.name} is typing`;
    if (users.length === 2) return `${users[0]?.name} and ${users[1]?.name} are typing`;
    return `${users[0]?.name} and ${users.length - 1} others are typing`;
  },
};

export const SingleUser: Story = {
  args: {
    users: [alice],
    copy: typingCopy,
  },
};

export const TwoUsers: Story = {
  args: {
    users: [alice, bob],
    copy: typingCopy,
  },
};

export const ThreeUsers: Story = {
  args: {
    users: [alice, bob, charlie],
    copy: typingCopy,
  },
};

export const ManyUsers: Story = {
  args: {
    users: [alice, bob, charlie, david],
    copy: typingCopy,
  },
};

export const NoUsers: Story = {
  args: {
    users: [],
    copy: typingCopy,
  },
};

export const InChatContext: Story = {
  args: {
    users: [alice],
    copy: typingCopy,
  },
  render: (args) => (
    <div className="flex flex-col gap-4 w-full max-w-2xl p-4 bg-background rounded-lg border">
      <div className="flex gap-2.5 max-w-[85%] mr-auto">
        <div className="flex flex-col gap-1 items-start">
          <span className="text-xs font-medium text-muted-foreground px-1">
            Alice Johnson
          </span>
          <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-card border border-border rounded-bl-md">
            Hey! Are you there?
          </div>
        </div>
      </div>
      <TypingIndicator users={args.users} copy={typingCopy} />
    </div>
  ),
};
