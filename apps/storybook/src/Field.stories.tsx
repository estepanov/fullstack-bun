import type { Meta, StoryObj } from "@storybook/react";
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "frontend-common/components/ui";

const meta = {
  title: "UI/Field",
  component: Field,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicField: Story = {
  render: () => (
    <div className="w-[400px]">
      <Field>
        <FieldLabel htmlFor="email">Email Address</FieldLabel>
        <Input type="email" id="email" placeholder="you@example.com" />
      </Field>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="w-[400px]">
      <Field>
        <FieldLabel htmlFor="username">Username</FieldLabel>
        <Input type="text" id="username" placeholder="johndoe" />
        <FieldDescription>
          Choose a unique username between 3-16 characters.
        </FieldDescription>
      </Field>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-[400px]">
      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input type="password" id="password" placeholder="••••••••" />
        <FieldError>Password must be at least 8 characters long</FieldError>
      </Field>
    </div>
  ),
};

export const WithDescriptionAndError: Story = {
  render: () => (
    <div className="w-[400px]">
      <Field>
        <FieldLabel htmlFor="email-error">Email Address</FieldLabel>
        <Input
          type="email"
          id="email-error"
          placeholder="you@example.com"
          aria-invalid="true"
        />
        <FieldDescription>We'll never share your email.</FieldDescription>
        <FieldError>Please enter a valid email address</FieldError>
      </Field>
    </div>
  ),
};

export const HorizontalField: Story = {
  render: () => (
    <div className="w-[400px]">
      <Field orientation="horizontal">
        <Input type="checkbox" id="terms" />
        <FieldLabel htmlFor="terms" className="font-normal">
          I agree to the terms and conditions
        </FieldLabel>
      </Field>
    </div>
  ),
};

export const MultipleFields: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <Field>
        <FieldLabel htmlFor="name">Full Name</FieldLabel>
        <Input type="text" id="name" placeholder="John Doe" />
      </Field>

      <Field>
        <FieldLabel htmlFor="email2">Email Address</FieldLabel>
        <Input type="email" id="email2" placeholder="you@example.com" />
        <FieldDescription>We'll use this for account recovery.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="bio">Bio</FieldLabel>
        <Textarea id="bio" placeholder="Tell us about yourself..." rows={4} />
        <FieldDescription>Maximum 500 characters.</FieldDescription>
      </Field>
    </div>
  ),
};

export const FieldSetExample: Story = {
  render: () => (
    <div className="w-[500px]">
      <FieldSet>
        <FieldLegend>Personal Information</FieldLegend>
        <FieldDescription>
          Update your personal details below.
        </FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="first-name">First Name</FieldLabel>
            <Input type="text" id="first-name" placeholder="John" />
          </Field>

          <Field>
            <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
            <Input type="text" id="last-name" placeholder="Doe" />
          </Field>

          <Field>
            <FieldLabel htmlFor="email3">Email</FieldLabel>
            <Input type="email" id="email3" placeholder="john@example.com" />
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  ),
};

export const WithSeparator: Story = {
  render: () => (
    <div className="w-[500px]">
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Account Details</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="username2">Username</FieldLabel>
              <Input type="text" id="username2" placeholder="johndoe" />
            </Field>

            <Field>
              <FieldLabel htmlFor="email4">Email</FieldLabel>
              <Input type="email" id="email4" placeholder="john@example.com" />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Security</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="current-password">Current Password</FieldLabel>
              <Input type="password" id="current-password" />
            </Field>

            <Field>
              <FieldLabel htmlFor="new-password">New Password</FieldLabel>
              <Input type="password" id="new-password" />
            </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </div>
  ),
};

export const CompleteForm: Story = {
  render: () => (
    <div className="w-[600px] p-6 bg-card border rounded-xl shadow-sm">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold">Create Account</h2>
          <p className="text-sm text-muted-foreground">
            Fill out the form below to create your account.
          </p>
        </div>

        <FieldGroup>
          <FieldSet>
            <FieldLegend>Personal Information</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                <Input type="text" id="full-name" placeholder="John Doe" required />
              </Field>

              <Field>
                <FieldLabel htmlFor="signup-email">Email Address</FieldLabel>
                <Input
                  type="email"
                  id="signup-email"
                  placeholder="john@example.com"
                  required
                />
                <FieldDescription>
                  We'll send a verification email to this address.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Account Security</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                <Input
                  type="password"
                  id="signup-password"
                  placeholder="••••••••"
                  required
                />
                <FieldDescription>
                  Must be at least 8 characters with uppercase and numbers.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                <Input
                  type="password"
                  id="confirm-password"
                  placeholder="••••••••"
                  required
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Preferences</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select defaultValue="">
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="designer">Designer</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field orientation="horizontal">
                <Input type="checkbox" id="newsletter" />
                <FieldLabel htmlFor="newsletter" className="font-normal">
                  Subscribe to newsletter for product updates
                </FieldLabel>
              </Field>

              <Field orientation="horizontal">
                <Input type="checkbox" id="terms-signup" required />
                <FieldLabel htmlFor="terms-signup" className="font-normal">
                  I agree to the terms and conditions
                </FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>

          <Field orientation="horizontal">
            <Button type="submit">Create Account</Button>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Field>
        </FieldGroup>
      </div>
    </div>
  ),
};
