import type { Meta, StoryObj } from "@storybook/react";
import { Label, Textarea } from "frontend-common/components/ui";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Whether the textarea is disabled",
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultTextarea: Story = {
  args: {
    placeholder: "Type your message here...",
  },
  render: (args) => (
    <div className="w-87.5">
      <Textarea {...args} />
    </div>
  ),
};

export const TextareaWithLabel: Story = {
  render: () => (
    <div className="w-87.5 flex flex-col gap-2">
      <Label htmlFor="textarea-with-label">Description</Label>
      <Textarea id="textarea-with-label" placeholder="Describe your project..." />
    </div>
  ),
};

export const DisabledTextarea: Story = {
  args: {
    disabled: true,
    value: "This textarea is disabled",
  },
  render: (args) => (
    <div className="w-87.5">
      <Textarea {...args} />
    </div>
  ),
};

export const TextareaWithError: Story = {
  render: () => (
    <div className="w-87.5 flex flex-col gap-2">
      <Label htmlFor="textarea-error" variant="required">
        Message
      </Label>
      <Textarea id="textarea-error" placeholder="Your message..." aria-invalid="true" />
      <p className="text-sm text-destructive">Message is required</p>
    </div>
  ),
};
