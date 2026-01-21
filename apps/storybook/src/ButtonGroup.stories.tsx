import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "frontend-common/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "frontend-common/components/ui/button-group";
import { AlignCenter, Bold, Italic, Underline } from "lucide-react";
import type * as React from "react";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

type ButtonSize = "default" | "xs" | "sm" | "md" | "lg" | "xl" | "icon";

type ButtonGroupStoryArgs = React.ComponentProps<typeof ButtonGroup> & {
  buttonVariant: ButtonVariant;
  buttonSize: ButtonSize;
};

const meta = {
  title: "UI/ButtonGroup",
  component: ButtonGroup as React.ComponentType<ButtonGroupStoryArgs>,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Layout direction for the grouped items",
    },
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      description: "Group container variant",
    },
    buttonVariant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      description: "Button variant applied to grouped buttons",
    },
    buttonSize: {
      control: "select",
      options: ["default", "xs", "sm", "md", "lg", "xl", "icon"],
      description: "Button size applied to grouped buttons",
    },
  },
} satisfies Meta<ButtonGroupStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    variant: "default",
    buttonVariant: "default",
    buttonSize: "md",
    orientation: "horizontal",
  },
  render: ({ buttonVariant, buttonSize, ...groupProps }) => {
    const isIconOnly = buttonSize === "icon";

    return (
      <ButtonGroup {...groupProps}>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          aria-label={isIconOnly ? "Bold" : undefined}
        >
          {isIconOnly ? <Bold className="h-4 w-4" /> : "Left"}
        </Button>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          aria-label={isIconOnly ? "Italic" : undefined}
        >
          {isIconOnly ? <Italic className="h-4 w-4" /> : "Middle"}
        </Button>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          aria-label={isIconOnly ? "Underline" : undefined}
        >
          {isIconOnly ? <Underline className="h-4 w-4" /> : "Right"}
        </Button>
      </ButtonGroup>
    );
  },
};

export const Default: Story = {
  args: {
    variant: "default",
    buttonVariant: "default",
    buttonSize: "md",
    orientation: "horizontal",
  },
  render: ({ buttonVariant, buttonSize, ...groupProps }) => (
    <ButtonGroup {...groupProps}>
      <Button variant={buttonVariant} size={buttonSize}>
        Left
      </Button>
      <Button variant={buttonVariant} size={buttonSize}>
        Middle
      </Button>
      <Button variant={buttonVariant} size={buttonSize}>
        Right
      </Button>
    </ButtonGroup>
  ),
};

export const WithIcons: Story = {
  args: {
    variant: "default",
    buttonVariant: "default",
    buttonSize: "icon",
    orientation: "horizontal",
  },
  render: ({ buttonVariant, buttonSize, ...groupProps }) => (
    <ButtonGroup {...groupProps}>
      <Button variant={buttonVariant} size={buttonSize} aria-label="Bold">
        <Bold className="h-4 w-4" />
      </Button>
      <Button variant={buttonVariant} size={buttonSize} aria-label="Italic">
        <Italic className="h-4 w-4" />
      </Button>
      <Button variant={buttonVariant} size={buttonSize} aria-label="Underline">
        <Underline className="h-4 w-4" />
      </Button>
      <Button variant={buttonVariant} size={buttonSize} aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </Button>
    </ButtonGroup>
  ),
};

export const WithText: Story = {
  args: {
    variant: "default",
    buttonVariant: "destructive",
    buttonSize: "md",
    orientation: "horizontal",
  },
  render: ({ buttonVariant, buttonSize, ...groupProps }) => (
    <ButtonGroup {...groupProps}>
      <ButtonGroupText>Sort</ButtonGroupText>
      <Button variant={buttonVariant}>Newest</Button>
      <Button variant={buttonVariant}>Popular</Button>
      <Button variant={buttonVariant}>Oldest</Button>
    </ButtonGroup>
  ),
};

export const WithSeparator: Story = {
  args: {
    orientation: "horizontal",
    variant: "default",
    buttonVariant: "default",
    buttonSize: "md",
  },
  render: ({ buttonVariant, buttonSize, ...groupProps }) => (
    <ButtonGroup {...groupProps}>
      <Button variant={buttonVariant} size={buttonSize}>
        Day
      </Button>
      <Button variant={buttonVariant} size={buttonSize}>
        Week
      </Button>
      <Button variant={buttonVariant} size={buttonSize}>
        Month
      </Button>
      <ButtonGroupSeparator />
      <Button variant="secondary" size={buttonSize}>
        Export
      </Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
    variant: "default",
    buttonVariant: "default",
    buttonSize: "md",
  },
  render: ({ buttonVariant, buttonSize, ...groupProps }) => (
    <ButtonGroup {...groupProps}>
      <Button variant={buttonVariant} size={buttonSize}>
        First
      </Button>
      <Button variant={buttonVariant} size={buttonSize}>
        Second
      </Button>
      <Button variant={buttonVariant} size={buttonSize}>
        Third
      </Button>
    </ButtonGroup>
  ),
};

export const TextAsChild: Story = {
  args: {
    orientation: "horizontal",
    variant: "default",
    buttonVariant: "default",
    buttonSize: "md",
  },
  render: ({ buttonVariant, buttonSize, ...groupProps }) => (
    <ButtonGroup {...groupProps}>
      <ButtonGroupText asChild>
        <a href="https://example.com" target="_blank" rel="noopener noreferrer">
          Plan
        </a>
      </ButtonGroupText>
      <Button variant={buttonVariant} size={buttonSize}>
        Starter
      </Button>
      <Button variant={buttonVariant} size={buttonSize}>
        Pro
      </Button>
    </ButtonGroup>
  ),
};
