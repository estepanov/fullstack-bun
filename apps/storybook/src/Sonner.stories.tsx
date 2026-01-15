import type { Meta, StoryObj } from "@storybook/react";
import { Toaster } from "frontend-common/components/ui";
import { Button } from "frontend-common/components/ui";
import { toast } from "sonner";

const meta = {
  title: "UI/Sonner",
  component: Toaster,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster richColors />
      </>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Button onClick={() => toast("This is a default toast message")}>Show Toast</Button>
  ),
};

export const Success: Story = {
  render: () => (
    <Button onClick={() => toast.success("Profile updated successfully!")}>
      Show Success
    </Button>
  ),
};

export const Error: Story = {
  render: () => (
    <Button variant="destructive" onClick={() => toast.error("Failed to save changes")}>
      Show Error
    </Button>
  ),
};

export const Info: Story = {
  render: () => (
    <Button variant="outline" onClick={() => toast.info("New version available")}>
      Show Info
    </Button>
  ),
};

export const Warning: Story = {
  render: () => (
    <Button
      variant="secondary"
      onClick={() => toast.warning("Your session will expire in 5 minutes")}
    >
      Show Warning
    </Button>
  ),
};

export const Loading: Story = {
  render: () => (
    <Button
      onClick={() => {
        const id = toast.loading("Uploading file...");
        setTimeout(() => {
          toast.success("File uploaded!", { id });
        }, 2000);
      }}
    >
      Show Loading
    </Button>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast("Event created", {
          description: "Your event has been scheduled for tomorrow at 2 PM",
        })
      }
    >
      Show with Description
    </Button>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast("File deleted", {
          action: {
            label: "Undo",
            onClick: () => console.log("Undo clicked"),
          },
        })
      }
    >
      Show with Action
    </Button>
  ),
};

export const CustomDuration: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast("This toast will disappear in 10 seconds", {
          duration: 10000,
        })
      }
    >
      Show Long Duration
    </Button>
  ),
};

export const Promise: Story = {
  render: () => (
    <Button
      onClick={() => {
        const promise = new Promise((resolve) =>
          setTimeout(() => resolve({ name: "John Doe" }), 2000),
        );

        toast.promise(promise, {
          loading: "Loading data...",
          success: "Data loaded successfully!",
          error: "Failed to load data",
        });
      }}
    >
      Show Promise Toast
    </Button>
  ),
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold">Without Description</h1>
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => toast("Default message")}>Default</Button>
        <Button onClick={() => toast.success("Success message")}>Success</Button>
        <Button variant="destructive" onClick={() => toast.error("Error message")}>
          Error
        </Button>
        <Button variant="outline" onClick={() => toast.info("Info message")}>
          Info
        </Button>
        <Button variant="secondary" onClick={() => toast.warning("Warning message")}>
          Warning
        </Button>
        <Button onClick={() => toast.loading("Loading...")}>Loading</Button>
      </div>
      <h1 className="text-lg font-bold">With Description</h1>
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() =>
            toast("Default message", {
              description: "This is a default message",
              action: <Button variant="outline">action</Button>,
              cancel: <Button variant="destructive">Cancel</Button>,
            })
          }
        >
          Default
        </Button>
        <Button
          onClick={() =>
            toast.success("Success message", {
              description: "This is a success message",
              action: <Button variant="outline">undo</Button>,
            })
          }
        >
          Success
        </Button>
        <Button
          variant="destructive"
          onClick={() =>
            toast.error("Error message", {
              description: "This is an error message",
              action: <Button variant="link">undo</Button>,
            })
          }
        >
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.info("Info message", {
              description: "This is an info message",
              action: <Button variant="link">undo</Button>,
            })
          }
        >
          Info
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.warning("Warning message", {
              description: "This is a warning message",
              action: <Button variant="link">undo</Button>,
            })
          }
        >
          Warning
        </Button>
        <Button
          onClick={() =>
            toast.loading("Loading...", {
              description: "This is a loading message",
              action: <Button variant="link">undo</Button>,
            })
          }
        >
          Loading
        </Button>
      </div>
    </div>
  ),
};
