import type { Meta, StoryObj } from '@storybook/react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from 'frontend-common/components/ui';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'destructive', 'info'],
      description: 'Visual style of the alert',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Padding and text sizing',
    },
  },
  args: {
    variant: 'default',
    size: 'md',
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args} className="max-w-md">
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        You can customize alerts with different variants and sizes.
      </AlertDescription>
    </Alert>
  ),
};

export const InfoAlert: Story = {
  render: (args) => (
    <Alert {...args} variant="info" className="max-w-md">
      <AlertTitle>Protected route</AlertTitle>
      <AlertDescription>
        Only authenticated users can see this page.
      </AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: (args) => (
    <Alert {...args} variant="success" className="max-w-md">
      <AlertTitle>Profile updated</AlertTitle>
      <AlertDescription>Your changes are live across your account.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: (args) => (
    <Alert {...args} variant="destructive" className="max-w-md">
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>
        We could not process your card. Try another method.
      </AlertDescription>
    </Alert>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Alert variant="primary" size="md" className="max-w-md">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 size-4" />
        <div className="grid gap-1">
          <AlertTitle>New feature</AlertTitle>
          <AlertDescription>
            Try the new activity filters to focus on what matters.
          </AlertDescription>
        </div>
      </div>
    </Alert>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <Alert variant="default">
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>Neutral messaging for general updates.</AlertDescription>
      </Alert>
      <Alert variant="primary">
        <AlertTitle>Primary</AlertTitle>
        <AlertDescription>Highlights the most important message.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-4" />
          <div className="grid gap-1">
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>Helpful context or guidance.</AlertDescription>
          </div>
        </div>
      </Alert>
      <Alert variant="success">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-4" />
          <div className="grid gap-1">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Everything completed successfully.</AlertDescription>
          </div>
        </div>
      </Alert>
      <Alert variant="destructive">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-4" />
          <div className="grid gap-1">
            <AlertTitle>Destructive</AlertTitle>
            <AlertDescription>Something needs your attention.</AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <Alert size="xs">
        <AlertTitle>Extra small</AlertTitle>
        <AlertDescription>Compact alert styling.</AlertDescription>
      </Alert>
      <Alert size="sm">
        <AlertTitle>Small</AlertTitle>
        <AlertDescription>Smaller padding with readable text.</AlertDescription>
      </Alert>
      <Alert size="md">
        <AlertTitle>Medium</AlertTitle>
        <AlertDescription>Standard spacing and type size.</AlertDescription>
      </Alert>
      <Alert size="lg">
        <AlertTitle>Large</AlertTitle>
        <AlertDescription>Roomier layout with larger text.</AlertDescription>
      </Alert>
      <Alert size="xl">
        <AlertTitle>Extra large</AlertTitle>
        <AlertDescription>Expanded spacing for emphasis.</AlertDescription>
      </Alert>
    </div>
  ),
};
