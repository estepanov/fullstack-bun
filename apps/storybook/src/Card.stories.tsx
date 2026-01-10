import type { Meta, StoryObj } from "@storybook/react";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "frontend-common/components/ui";
import { Bell, MoreVertical } from "lucide-react";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-87.5">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card.</p>
      </CardContent>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card className="w-87.5">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Your post has been published</p>
            <p className="text-sm text-muted-foreground">2 minutes ago</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-87.5">
      <CardHeader>
        <CardTitle>Create Project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Configure your project settings and deploy to production with just one click.
        </p>
      </CardContent>
      <CardFooter className="border-t">
        <div className="flex gap-2 ml-auto">
          <Button variant="outline">Cancel</Button>
          <Button>Deploy</Button>
        </div>
      </CardFooter>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: () => (
    <Card className="w-87.5">
      <CardContent>
        <p>A simple card with only content, no header or footer.</p>
      </CardContent>
    </Card>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Card className="w-87.5">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="px-3 py-2 border rounded-md"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <Button className="w-full">Sign In</Button>
      </CardFooter>
    </Card>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap max-w-3xl">
      <Card className="w-62.5">
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>View your site analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">12,345</div>
          <p className="text-sm text-muted-foreground">Total visitors</p>
        </CardContent>
      </Card>

      <Card className="w-62.5">
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Monthly earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">$4,231</div>
          <p className="text-sm text-muted-foreground">+12% from last month</p>
        </CardContent>
      </Card>

      <Card className="w-62.5">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Active users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">2,345</div>
          <p className="text-sm text-muted-foreground">+180 new this week</p>
        </CardContent>
      </Card>
    </div>
  ),
};
