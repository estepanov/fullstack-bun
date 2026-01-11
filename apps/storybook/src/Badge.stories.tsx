import type { Meta, StoryObj } from '@storybook/react';
import { Check, AlertTriangle, Info, User } from 'lucide-react';
import { Badge } from 'frontend-common/components/ui';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'destructive', 'info'],
      description: 'Visual style of the badge',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Padding and text sizing',
    },
  },
  args: {
    children: 'Badge',
    variant: 'default',
    size: 'md',
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
};

export const InfoBadge: Story = {
  args: {
    variant: 'info',
    children: 'Info',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small size',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium size',
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="info" size="sm" className="gap-1">
        <User className="h-3.5 w-3.5" />
        You
      </Badge>
      <Badge variant="primary" className="gap-1">
        <Info className="h-4 w-4" />
        Verified
      </Badge>
      <Badge variant="success" className="gap-1">
        <Check className="h-4 w-4" />
        Active
      </Badge>
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-4 w-4" />
        Banned
      </Badge>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="info">Info</Badge>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Badge size="xs">Extra Small</Badge>
        <Badge size="sm">Small</Badge>
        <Badge size="md">Medium</Badge>
        <Badge size="lg">Large</Badge>
        <Badge size="xl">Extra Large</Badge>
      </div>
    </div>
  ),
};
