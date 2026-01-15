import type { Meta, StoryObj } from "@storybook/react";
import { UserAvatar } from "frontend-common/components/ui";
import type { User } from "frontend-common/lib/chat-types";

const meta = {
  title: "UI/UserAvatar",
  component: UserAvatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The size of the avatar",
    },
    showStatus: {
      control: "boolean",
      description: "Whether to show the status indicator",
    },
  },
} satisfies Meta<typeof UserAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

const onlineUser: User = {
  id: "1",
  name: "Alice Johnson",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  status: "online",
};

const offlineUser: User = {
  id: "2",
  name: "Bob Smith",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  status: "offline",
};

const awayUser: User = {
  id: "3",
  name: "Charlie Brown",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  status: "away",
};

const noAvatarUser: User = {
  id: "4",
  name: "David Lee",
};

export const Default: Story = {
  args: {
    user: onlineUser,
    size: "md",
    showStatus: false,
  },
};

export const WithOnlineStatus: Story = {
  args: {
    user: onlineUser,
    size: "md",
    showStatus: true,
  },
};

export const WithOfflineStatus: Story = {
  args: {
    user: offlineUser,
    size: "md",
    showStatus: true,
  },
};

export const WithAwayStatus: Story = {
  args: {
    user: awayUser,
    size: "md",
    showStatus: true,
  },
};

export const NoAvatar: Story = {
  args: {
    user: noAvatarUser,
    size: "md",
    showStatus: false,
  },
};

export const Small: Story = {
  args: {
    user: onlineUser,
    size: "sm",
    showStatus: true,
  },
};

export const Medium: Story = {
  args: {
    user: onlineUser,
    size: "md",
    showStatus: true,
  },
};

export const Large: Story = {
  args: {
    user: onlineUser,
    size: "lg",
    showStatus: true,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <UserAvatar user={onlineUser} size="sm" showStatus />
      <UserAvatar user={onlineUser} size="md" showStatus />
      <UserAvatar user={onlineUser} size="lg" showStatus />
    </div>
  ),
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <UserAvatar user={onlineUser} size="md" showStatus />
        <span className="text-xs text-muted-foreground">Online</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <UserAvatar user={offlineUser} size="md" showStatus />
        <span className="text-xs text-muted-foreground">Offline</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <UserAvatar user={awayUser} size="md" showStatus />
        <span className="text-xs text-muted-foreground">Away</span>
      </div>
    </div>
  ),
};
