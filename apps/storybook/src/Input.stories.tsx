import type { Meta, StoryObj } from "@storybook/react";
import { Button, Input, InputError, Label, Textarea } from "frontend-common/components/ui";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: [
        "text",
        "email",
        "password",
        "number",
        "tel",
        "url",
        "search",
        "date",
        "time",
        "file",
        "checkbox",
      ],
      description: "The input type",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextInput: Story = {
  args: {
    type: "text",
    placeholder: "Enter text...",
  },
  render: (args) => (
    <div className="w-87.5">
      <Input {...args} />
    </div>
  ),
};

export const EmailInput: Story = {
  args: {
    type: "email",
    placeholder: "you@example.com",
  },
  render: (args) => (
    <div className="w-87.5">
      <Input {...args} />
    </div>
  ),
};

export const PasswordInput: Story = {
  args: {
    type: "password",
    placeholder: "••••••••",
  },
  render: (args) => (
    <div className="w-87.5">
      <Input {...args} />
    </div>
  ),
};

export const NumberInput: Story = {
  args: {
    type: "number",
    placeholder: "42",
  },
  render: (args) => (
    <div className="w-87.5">
      <Input {...args} />
    </div>
  ),
};

export const SearchInput: Story = {
  args: {
    type: "search",
    placeholder: "Search...",
  },
  render: (args) => (
    <div className="w-87.5">
      <Input {...args} />
    </div>
  ),
};

export const FileInput: Story = {
  args: {
    type: "file",
  },
  render: (args) => (
    <div className="w-87.5">
      <Input {...args} />
    </div>
  ),
};

export const CheckboxInput: Story = {
  args: {
    type: "checkbox",
    id: "checkbox-example",
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Input {...args} />
      <Label htmlFor="checkbox-example">Accept terms and conditions</Label>
    </div>
  ),
};

export const DisabledInput: Story = {
  args: {
    type: "text",
    placeholder: "Disabled input",
    disabled: true,
    value: "Cannot edit this",
  },
  render: (args) => (
    <div className="w-87.5">
      <Input {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-87.5 flex flex-col gap-2">
      <Label htmlFor="input-with-label">Email Address</Label>
      <Input type="email" id="input-with-label" placeholder="you@example.com" />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-87.5 flex flex-col gap-2">
      <Label htmlFor="input-error" variant="required">
        Email Address
      </Label>
      <Input
        type="email"
        id="input-error"
        placeholder="you@example.com"
        aria-invalid="true"
      />
      <InputError>Please enter a valid email address</InputError>
    </div>
  ),
};

// Complete Form Example
export const CompleteForm: Story = {
  render: () => (
    <div className="w-[400px] p-6 bg-card border rounded-xl shadow-sm">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold">Contact Us</h2>
          <p className="text-sm text-muted-foreground">
            Fill out the form below to get in touch.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" variant="required">
              Full Name
            </Label>
            <Input type="text" id="name" placeholder="John Doe" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" variant="required">
              Email Address
            </Label>
            <Input type="email" id="email" placeholder="john@example.com" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input type="tel" id="phone" placeholder="+1 (555) 000-0000" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="message" variant="required">
              Message
            </Label>
            <Textarea id="message" placeholder="How can we help you?" />
          </div>

          <div className="flex items-center gap-2">
            <Input type="checkbox" id="subscribe" />
            <Label htmlFor="subscribe" size="sm">
              Subscribe to our newsletter
            </Label>
          </div>

          <Button className="w-full">Send Message</Button>
        </div>
      </div>
    </div>
  ),
};
