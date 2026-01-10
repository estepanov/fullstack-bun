import type { Meta, StoryObj } from '@storybook/react';
import { Label } from 'frontend-common/components/ui';

const meta = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'muted', 'subtle', 'required'],
      description: 'The visual style variant of the label',
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg'],
      description: 'The size of the label',
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultLabel: Story = {
  args: {
    children: 'Label',
    variant: 'default',
  },
};

export const MutedLabel: Story = {
  args: {
    children: 'Muted Label',
    variant: 'muted',
  },
};

export const SubtleLabel: Story = {
  args: {
    children: 'Subtle Label',
    variant: 'subtle',
  },
};

export const RequiredLabel: Story = {
  args: {
    children: 'Required Field',
    variant: 'required',
  },
};

export const ExtraSmallLabel: Story = {
  args: {
    children: 'Extra Small',
    size: 'xs',
  },
};

export const SmallLabel: Story = {
  args: {
    children: 'Small Label',
    size: 'sm',
  },
};

export const LargeLabel: Story = {
  args: {
    children: 'Large Label',
    size: 'lg',
  },
};
