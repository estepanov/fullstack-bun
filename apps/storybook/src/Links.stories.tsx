import type { Meta, StoryObj } from "@storybook/react";
import { Link, StyledLink } from "frontend-common/components/ui";
import { ArrowRight, ExternalLink, Home } from "lucide-react";
import { MemoryRouter } from "react-router";

// Link Stories
const linkMeta = {
  title: "UI/Link",
  component: Link,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Link>;

export default linkMeta;
type LinkStory = StoryObj<typeof Link>;

export const DefaultLink: LinkStory = {
  args: {
    to: "/example",
    children: "Example Link",
    onClick: () => console.log("Link clicked"),
  },
};

export const LinkInText: LinkStory = {
  args: {
    to: "/terms",
    children: "link to terms",
  },
  render: () => (
    <p className="text-sm max-w-md">
      This is a paragraph with a <Link to="/terms">link to terms</Link> and another{" "}
      <Link to="/privacy">link to privacy policy</Link> embedded within the text.
    </p>
  ),
};

export const LinkWithIcon: LinkStory = {
  args: {
    to: "/external",
    children: "Visit our website",
  },
  render: (args) => (
    <Link {...args} className="inline-flex items-center gap-1">
      {args.children}
      <ExternalLink className="h-3 w-3" />
    </Link>
  ),
};

// StyledLink Stories
export const styledLinkMeta = {
  title: "UI/StyledLink",
  component: StyledLink,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      description: "The visual style variant",
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon"],
      description: "The size of the link",
    },
    external: {
      control: "boolean",
      description: "Render as external link (uses <a> tag)",
    },
  },
} satisfies Meta<typeof StyledLink>;

type StyledLinkStory = StoryObj<typeof StyledLink>;

export const DefaultStyledLink: StyledLinkStory = {
  args: {
    to: "/dashboard",
    children: "Go to Dashboard",
    variant: "default",
  },
};

export const OutlineStyledLink: StyledLinkStory = {
  args: {
    to: "/settings",
    children: "Settings",
    variant: "outline",
  },
};

export const SecondaryStyledLink: StyledLinkStory = {
  args: {
    to: "/profile",
    children: "View Profile",
    variant: "secondary",
  },
};

export const GhostStyledLink: StyledLinkStory = {
  args: {
    to: "/help",
    children: "Help",
    variant: "ghost",
  },
};

export const LinkVariant: StyledLinkStory = {
  args: {
    to: "/about",
    children: "About Us",
    variant: "link",
  },
};

export const DestructiveStyledLink: StyledLinkStory = {
  args: {
    to: "/delete",
    children: "Delete Account",
    variant: "destructive",
  },
};

export const SmallStyledLink: StyledLinkStory = {
  args: {
    to: "/small",
    children: "Small Link",
    size: "sm",
  },
};

export const LargeStyledLink: StyledLinkStory = {
  args: {
    to: "/large",
    children: "Large Link",
    size: "lg",
  },
};

export const ExtraSmallStyledLink: StyledLinkStory = {
  args: {
    to: "/xs",
    children: "Extra Small",
    size: "xs",
  },
};

export const StyledLinkWithIcon: StyledLinkStory = {
  render: () => (
    <StyledLink to="/home">
      <Home className="h-4 w-4" />
      Go Home
    </StyledLink>
  ),
};

export const StyledLinkWithRightIcon: StyledLinkStory = {
  render: () => (
    <StyledLink to="/next" variant="outline">
      Continue
      <ArrowRight className="h-4 w-4" />
    </StyledLink>
  ),
};

export const ExternalStyledLink: StyledLinkStory = {
  args: {
    href: "https://github.com",
    external: true,
    children: "Visit GitHub",
    variant: "outline",
    target: "_blank",
    rel: "noopener noreferrer",
  },
};

export const ExternalStyledLinkWithIcon: StyledLinkStory = {
  render: () => (
    <StyledLink
      href="https://example.com"
      external
      variant="secondary"
      target="_blank"
      rel="noopener noreferrer"
    >
      Visit Website
      <ExternalLink className="h-4 w-4" />
    </StyledLink>
  ),
};

export const AllVariants: StyledLinkStory = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <StyledLink to="/default" variant="default">
          Default
        </StyledLink>
        <StyledLink to="/destructive" variant="destructive">
          Destructive
        </StyledLink>
        <StyledLink to="/outline" variant="outline">
          Outline
        </StyledLink>
        <StyledLink to="/secondary" variant="secondary">
          Secondary
        </StyledLink>
        <StyledLink to="/ghost" variant="ghost">
          Ghost
        </StyledLink>
        <StyledLink to="/link" variant="link">
          Link
        </StyledLink>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <StyledLink to="/xs" size="xs">
          Extra Small
        </StyledLink>
        <StyledLink to="/sm" size="sm">
          Small
        </StyledLink>
        <StyledLink to="/default">Default</StyledLink>
        <StyledLink to="/lg" size="lg">
          Large
        </StyledLink>
      </div>
    </div>
  ),
};

export const CallToAction: StyledLinkStory = {
  render: () => (
    <div className="flex flex-col items-center gap-6 max-w-md text-center p-8 bg-card border rounded-xl">
      <h2 className="text-2xl font-bold">Ready to get started?</h2>
      <p className="text-muted-foreground">
        Join thousands of developers already building with our platform.
      </p>
      <div className="flex gap-4">
        <StyledLink to="/signup" size="lg">
          Sign Up Free
          <ArrowRight className="h-4 w-4" />
        </StyledLink>
        <StyledLink to="/demo" variant="outline" size="lg">
          Watch Demo
        </StyledLink>
      </div>
    </div>
  ),
};
