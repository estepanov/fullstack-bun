import type { Meta, StoryObj } from '@storybook/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  Button,
  Input,
  Label,
} from 'frontend-common/components/ui';
import { AlertTriangle, Info } from 'lucide-react';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a description of what this dialog does. It provides context to the user.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">Dialog content goes here.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" variant="required">
              Name
            </Label>
            <Input id="name" defaultValue="John Doe" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="username" variant="required">
              Username
            </Label>
            <Input id="username" defaultValue="@johndoe" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="john@example.com" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const AlertDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
          </div>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove
            your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive">Delete Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const ConfirmationDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Publish Post</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Ready to publish?</DialogTitle>
          </div>
          <DialogDescription>
            Your post will be visible to all users. Make sure you've reviewed it before
            publishing.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button variant="outline">Review Again</Button>
          </DialogClose>
          <Button>Publish Now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Terms of Service</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>Please read our terms carefully.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm">
          <section>
            <h3 className="font-semibold mb-2">1. Introduction</h3>
            <p className="text-muted-foreground">
              Welcome to our service. By accessing or using our service, you agree to be bound by
              these Terms of Service and all applicable laws and regulations.
            </p>
          </section>
          <section>
            <h3 className="font-semibold mb-2">2. Use License</h3>
            <p className="text-muted-foreground">
              Permission is granted to temporarily download one copy of the materials on our
              service for personal, non-commercial transitory viewing only.
            </p>
          </section>
          <section>
            <h3 className="font-semibold mb-2">3. Disclaimer</h3>
            <p className="text-muted-foreground">
              The materials on our service are provided on an 'as is' basis. We make no
              warranties, expressed or implied, and hereby disclaim and negate all other
              warranties.
            </p>
          </section>
          <section>
            <h3 className="font-semibold mb-2">4. Limitations</h3>
            <p className="text-muted-foreground">
              In no event shall we or our suppliers be liable for any damages arising out of the
              use or inability to use our service.
            </p>
          </section>
          <section>
            <h3 className="font-semibold mb-2">5. Privacy</h3>
            <p className="text-muted-foreground">
              Your use of our service is also governed by our Privacy Policy. Please review our
              Privacy Policy to understand our practices.
            </p>
          </section>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Decline</Button>
          </DialogClose>
          <Button>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const NoDescription: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Quick Action</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Action</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">This dialog has no description, just a title and content.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>OK</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
