import type { Meta, StoryObj } from '@storybook/react';
import { Input, Textarea, Label, Button } from 'frontend-common/components/ui';

// Input Stories
const inputMeta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'file', 'checkbox'],
      description: 'The input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
  },
} satisfies Meta<typeof Input>;

export default inputMeta;
type InputStory = StoryObj<typeof inputMeta>;

export const TextInput: InputStory = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
  },
  render: (args) => (
    <div className="w-[350px]">
      <Input {...args} />
    </div>
  ),
};

export const EmailInput: InputStory = {
  args: {
    type: 'email',
    placeholder: 'you@example.com',
  },
  render: (args) => (
    <div className="w-[350px]">
      <Input {...args} />
    </div>
  ),
};

export const PasswordInput: InputStory = {
  args: {
    type: 'password',
    placeholder: '••••••••',
  },
  render: (args) => (
    <div className="w-[350px]">
      <Input {...args} />
    </div>
  ),
};

export const NumberInput: InputStory = {
  args: {
    type: 'number',
    placeholder: '42',
  },
  render: (args) => (
    <div className="w-[350px]">
      <Input {...args} />
    </div>
  ),
};

export const SearchInput: InputStory = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
  render: (args) => (
    <div className="w-[350px]">
      <Input {...args} />
    </div>
  ),
};

export const FileInput: InputStory = {
  args: {
    type: 'file',
  },
  render: (args) => (
    <div className="w-[350px]">
      <Input {...args} />
    </div>
  ),
};

export const CheckboxInput: InputStory = {
  args: {
    type: 'checkbox',
    id: 'checkbox-example',
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Input {...args} />
      <Label htmlFor="checkbox-example">Accept terms and conditions</Label>
    </div>
  ),
};

export const DisabledInput: InputStory = {
  args: {
    type: 'text',
    placeholder: 'Disabled input',
    disabled: true,
    value: 'Cannot edit this',
  },
  render: (args) => (
    <div className="w-[350px]">
      <Input {...args} />
    </div>
  ),
};

export const WithLabel: InputStory = {
  render: () => (
    <div className="w-[350px] flex flex-col gap-2">
      <Label htmlFor="input-with-label">Email Address</Label>
      <Input type="email" id="input-with-label" placeholder="you@example.com" />
    </div>
  ),
};

export const WithError: InputStory = {
  render: () => (
    <div className="w-[350px] flex flex-col gap-2">
      <Label htmlFor="input-error" variant="required">
        Email Address
      </Label>
      <Input
        type="email"
        id="input-error"
        placeholder="you@example.com"
        aria-invalid="true"
      />
      <p className="text-sm text-destructive">Please enter a valid email address</p>
    </div>
  ),
};

// Textarea Stories
const textareaMeta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
    },
  },
} satisfies Meta<typeof Textarea>;

type TextareaStory = StoryObj<typeof textareaMeta>;

export const DefaultTextarea: TextareaStory = {
  args: {
    placeholder: 'Type your message here...',
  },
  render: (args) => (
    <div className="w-[350px]">
      <Textarea {...args} />
    </div>
  ),
};

export const TextareaWithLabel: TextareaStory = {
  render: () => (
    <div className="w-[350px] flex flex-col gap-2">
      <Label htmlFor="textarea-with-label">Description</Label>
      <Textarea id="textarea-with-label" placeholder="Describe your project..." />
    </div>
  ),
};

export const DisabledTextarea: TextareaStory = {
  args: {
    disabled: true,
    value: 'This textarea is disabled',
  },
  render: (args) => (
    <div className="w-[350px]">
      <Textarea {...args} />
    </div>
  ),
};

export const TextareaWithError: TextareaStory = {
  render: () => (
    <div className="w-[350px] flex flex-col gap-2">
      <Label htmlFor="textarea-error" variant="required">
        Message
      </Label>
      <Textarea
        id="textarea-error"
        placeholder="Your message..."
        aria-invalid="true"
      />
      <p className="text-sm text-destructive">Message is required</p>
    </div>
  ),
};

// Label Stories
const labelMeta = {
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

type LabelStory = StoryObj<typeof labelMeta>;

export const DefaultLabel: LabelStory = {
  args: {
    children: 'Label',
    variant: 'default',
  },
};

export const MutedLabel: LabelStory = {
  args: {
    children: 'Muted Label',
    variant: 'muted',
  },
};

export const SubtleLabel: LabelStory = {
  args: {
    children: 'Subtle Label',
    variant: 'subtle',
  },
};

export const RequiredLabel: LabelStory = {
  args: {
    children: 'Required Field',
    variant: 'required',
  },
};

export const ExtraSmallLabel: LabelStory = {
  args: {
    children: 'Extra Small',
    size: 'xs',
  },
};

export const SmallLabel: LabelStory = {
  args: {
    children: 'Small Label',
    size: 'sm',
  },
};

export const LargeLabel: LabelStory = {
  args: {
    children: 'Large Label',
    size: 'lg',
  },
};

// Complete Form Example
export const CompleteForm: InputStory = {
  render: () => (
    <div className="w-[400px] p-6 bg-card border rounded-xl shadow-sm">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold">Contact Us</h2>
          <p className="text-sm text-muted-foreground">Fill out the form below to get in touch.</p>
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
