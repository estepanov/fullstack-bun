import type { Meta, StoryObj } from "@storybook/react";
import { Label, Select } from "frontend-common/components/ui";

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
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { label: "Viewer", value: "viewer" },
  { label: "Editor", value: "editor" },
  { label: "Admin", value: "admin" },
];

export const Default: Story = {
  args: {
    variant: "default",
    size: "md",
    defaultValue: "viewer",
  },
  render: (args) => (
    <div className="w-72">
      <Select {...args} aria-label="Select role">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex w-[420px] flex-col gap-3">
      {(["default", "soft", "subtle", "ghost"] as const).map((variant) => (
        <Select key={variant} variant={variant} defaultValue="viewer">
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex w-[420px] flex-col gap-3">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <Select key={size} size={size} variant="soft" defaultValue="editor">
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
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
    defaultValue: "admin",
  },
  render: (args) => (
    <div className="w-72">
      <Select {...args} aria-label="Select role">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
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
      <Select id="select-with-label" variant="soft" defaultValue="viewer">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  ),
};
