import type { Meta, StoryObj } from "@storybook/react";
import { Link, StyledLink } from "frontend-common/components/ui";
import { ArrowRight, ExternalLink, Home } from "lucide-react";
import type { ReactNode } from "react";
import { MemoryRouter, useInRouterContext } from "react-router";

const RouterDecorator = ({ children }: { children: ReactNode }) => {
  const alreadyInRouter = useInRouterContext();
  if (alreadyInRouter) {
    return <>{children}</>;
  }

  return <MemoryRouter>{children}</MemoryRouter>;
};

// Link Stories
const linkMeta = {
  title: "UI/Link",
  component: Link,
  decorators: [
    (Story) => (
      <RouterDecorator>
        <Story />
      </RouterDecorator>
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
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "The content of the link",
    },
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "muted",
        "subtle",
        "default-button",
        "destructive-button",
        "outline-button",
        "secondary-button",
        "ghost-button",
      ],
      description:
        "The visual style variant (link styles have no padding, button styles have full button appearance)",
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "md", "lg", "xl"],
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

export const MutedStyledLink: StyledLinkStory = {
  args: {
    to: "/about",
    children: "About Us",
    variant: "muted",
  },
};

export const SubtleStyledLink: StyledLinkStory = {
  args: {
    to: "/learn-more",
    children: "Learn More",
    variant: "subtle",
  },
};

export const DestructiveStyledLink: StyledLinkStory = {
  args: {
    to: "/delete",
    children: "Delete Account",
    variant: "destructive",
  },
};

export const DefaultButtonLink: StyledLinkStory = {
  args: {
    to: "/dashboard",
    children: "Go to Dashboard",
    variant: "default-button",
  },
};

export const OutlineButtonLink: StyledLinkStory = {
  args: {
    to: "/settings",
    children: "Settings",
    variant: "outline-button",
  },
};

export const SecondaryButtonLink: StyledLinkStory = {
  args: {
    to: "/profile",
    children: "View Profile",
    variant: "secondary-button",
  },
};

export const GhostButtonLink: StyledLinkStory = {
  args: {
    to: "/help",
    children: "Help",
    variant: "ghost-button",
  },
};

export const DestructiveButtonLink: StyledLinkStory = {
  args: {
    to: "/delete",
    children: "Delete Account",
    variant: "destructive-button",
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

export const LinksInText: StyledLinkStory = {
  render: () => (
    <div className="max-w-md space-y-4">
      <p className="text-sm">
        This is a paragraph with a <StyledLink to="/terms">default link</StyledLink> and
        a&nbsp;
        <StyledLink to="/delete" variant="destructive">
          destructive link
        </StyledLink>
        &nbsp; embedded within the text. Notice how they flow inline without padding.
      </p>
      <p className="text-sm">
        You can also use{" "}
        <StyledLink to="/muted" variant="muted">
          muted links
        </StyledLink>{" "}
        or&nbsp;
        <StyledLink to="/subtle" variant="subtle">
          subtle links
        </StyledLink>{" "}
        for less emphasis.
      </p>
    </div>
  ),
};

export const StyledLinkWithIcon: StyledLinkStory = {
  render: () => (
    <StyledLink to="/home" variant="default-button">
      <Home className="h-4 w-4" />
      Go Home
    </StyledLink>
  ),
};

export const StyledLinkWithRightIcon: StyledLinkStory = {
  render: () => (
    <StyledLink to="/next" variant="outline-button">
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
    variant: "outline-button",
    target: "_blank",
    rel: "noopener noreferrer",
  },
};

export const ExternalStyledLinkWithIcon: StyledLinkStory = {
  render: () => (
    <StyledLink
      href="https://example.com"
      external
      variant="secondary-button"
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
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
          Link Variants (inline, no padding)
        </h3>
        <div className="flex flex-wrap gap-4 items-center">
          <StyledLink to="/default" variant="default">
            Default
          </StyledLink>
          <StyledLink to="/destructive" variant="destructive">
            Destructive
          </StyledLink>
          <StyledLink to="/muted" variant="muted">
            Muted
          </StyledLink>
          <StyledLink to="/subtle" variant="subtle">
            Subtle
          </StyledLink>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
          Button Variants (full button appearance)
        </h3>
        <div className="flex flex-wrap gap-4">
          <StyledLink to="/default" variant="default-button">
            Default
          </StyledLink>
          <StyledLink to="/destructive" variant="destructive-button">
            Destructive
          </StyledLink>
          <StyledLink to="/outline" variant="outline-button">
            Outline
          </StyledLink>
          <StyledLink to="/secondary" variant="secondary-button">
            Secondary
          </StyledLink>
          <StyledLink to="/ghost" variant="ghost-button">
            Ghost
          </StyledLink>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
          Sizes (button variants)
        </h3>
        <div className="flex flex-wrap gap-4 items-center">
          <StyledLink to="/xs" variant="default-button" size="xs">
            Extra Small
          </StyledLink>
          <StyledLink to="/sm" variant="default-button" size="sm">
            Small
          </StyledLink>
          <StyledLink to="/default" variant="default-button" size="md">
            Medium
          </StyledLink>
          <StyledLink to="/lg" variant="default-button" size="lg">
            Large
          </StyledLink>
          <StyledLink to="/xl" variant="default-button" size="xl">
            Extra Large
          </StyledLink>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
          Sizes (link variants - text size only)
        </h3>
        <div className="flex flex-wrap gap-4 items-center">
          <StyledLink to="/xs" size="xs">
            Extra Small
          </StyledLink>
          <StyledLink to="/sm" size="sm">
            Small
          </StyledLink>
          <StyledLink to="/default">Medium</StyledLink>
          <StyledLink to="/lg" size="lg">
            Large
          </StyledLink>
          <StyledLink to="/xl" size="xl">
            Extra Large
          </StyledLink>
        </div>
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
        <StyledLink to="/signup" variant="default-button" size="lg">
          Sign Up Free
          <ArrowRight className="h-4 w-4" />
        </StyledLink>
        <StyledLink to="/demo" variant="outline-button" size="lg">
          Watch Demo
        </StyledLink>
      </div>
      <p className="text-xs text-muted-foreground">
        By signing up, you agree to our{" "}
        <StyledLink to="/terms" variant="muted">
          Terms of Service
        </StyledLink>{" "}
        and{" "}
        <StyledLink to="/privacy" variant="muted">
          Privacy Policy
        </StyledLink>
      </p>
    </div>
  ),
};
