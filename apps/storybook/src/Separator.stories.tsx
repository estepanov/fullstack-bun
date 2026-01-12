import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "frontend-common/components/ui";

const meta = {
  title: "UI/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "The orientation of the separator",
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
  },
  render: (args) => (
    <div className="w-[400px]">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Content Above</h3>
          <p className="text-sm text-muted-foreground">
            This is some content above the separator.
          </p>
        </div>
        <Separator {...args} />
        <div>
          <h3 className="text-sm font-medium">Content Below</h3>
          <p className="text-sm text-muted-foreground">
            This is some content below the separator.
          </p>
        </div>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  render: (args) => (
    <div className="flex h-20 items-center gap-4">
      <div className="flex-1">
        <p className="text-sm">Left Content</p>
      </div>
      <Separator {...args} />
      <div className="flex-1">
        <p className="text-sm">Right Content</p>
      </div>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="w-[400px] rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Card Title</h2>
          <p className="text-sm text-muted-foreground">Card subtitle or description</p>
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="text-sm">
            This is the main content of the card that appears after the separator.
          </p>
          <p className="text-sm text-muted-foreground">
            Separators are useful for dividing content sections.
          </p>
        </div>
      </div>
    </div>
  ),
};

export const MultipleSections: Story = {
  render: () => (
    <div className="w-[500px] rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Section 1</h3>
          <p className="text-sm text-muted-foreground">First section content</p>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold">Section 2</h3>
          <p className="text-sm text-muted-foreground">Second section content</p>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold">Section 3</h3>
          <p className="text-sm text-muted-foreground">Third section content</p>
        </div>
      </div>
    </div>
  ),
};

export const WithVerticalLayout: Story = {
  render: () => (
    <div className="flex h-[300px] w-[600px] rounded-xl border bg-card shadow-sm">
      <div className="flex-1 p-6">
        <h3 className="text-lg font-semibold">Left Panel</h3>
        <p className="mt-2 text-sm text-muted-foreground">Content in the left panel</p>
      </div>

      <Separator orientation="vertical" />

      <div className="flex-1 p-6">
        <h3 className="text-lg font-semibold">Center Panel</h3>
        <p className="mt-2 text-sm text-muted-foreground">Content in the center panel</p>
      </div>

      <Separator orientation="vertical" />

      <div className="flex-1 p-6">
        <h3 className="text-lg font-semibold">Right Panel</h3>
        <p className="mt-2 text-sm text-muted-foreground">Content in the right panel</p>
      </div>
    </div>
  ),
};
