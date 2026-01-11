import type { Meta, StoryObj } from "@storybook/react";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "frontend-common/components/ui";

type SelectStoryProps = {
  variant: "default" | "soft" | "subtle" | "ghost";
  size: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
};

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "soft", "subtle", "ghost"],
      description: "Visual style",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "Control size",
    },
    disabled: {
      control: "boolean",
      description: "Whether the select is disabled",
    },
  },
} satisfies Meta<SelectStoryProps>;

export default meta;
type Story = StoryObj<SelectStoryProps>;

const options = [
  { label: "Viewer", value: "viewer" },
  { label: "Editor", value: "editor" },
  { label: "Admin", value: "admin" },
];

export const Default: Story = {
  args: {
    variant: "default",
    size: "md",
    disabled: false,
  },
  render: ({ variant, size, disabled }) => (
    <div className="w-72">
      <Select defaultValue="viewer" disabled={disabled}>
        <SelectTrigger variant={variant} size={size} aria-label="Select role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex w-[420px] flex-col gap-3">
      {(["default", "soft", "subtle", "ghost"] as const).map((variant) => (
        <Select key={variant} defaultValue="viewer">
          <SelectTrigger variant={variant}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex w-[420px] flex-col gap-3">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <Select key={size} defaultValue="editor">
          <SelectTrigger size={size} variant="soft">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    variant: "soft",
    size: "md",
    disabled: true,
  },
  render: ({ variant, size, disabled }) => (
    <div className="w-72">
      <Select defaultValue="admin" disabled={disabled}>
        <SelectTrigger variant={variant} size={size} aria-label="Select role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-72 flex flex-col gap-2">
      <Label htmlFor="select-with-label" variant="required">
        Role
      </Label>
      <Select defaultValue="viewer">
        <SelectTrigger id="select-with-label" variant="soft">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),
};
