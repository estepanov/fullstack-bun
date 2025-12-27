import { cn } from "frontend-common/lib";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { Link as RouterLink } from "react-router";
import { type ButtonVariants, buttonVariants } from "./button.variants";

/**
 * StyledLink - A link component with all button variants and styles
 *
 * @example
 * // Internal link with default variant
 * <StyledLink to="/dashboard">Go to Dashboard</StyledLink>
 *
 * @example
 * // Internal link with primary variant
 * <StyledLink to="/login" variant="default" size="lg">
 *   Sign In
 * </StyledLink>
 *
 * @example
 * // External link with outline variant
 * <StyledLink href="https://example.com" external variant="outline">
 *   Visit Example
 * </StyledLink>
 *
 * @example
 * // Link styled as destructive button
 * <StyledLink to="/delete" variant="destructive" size="sm">
 *   Delete Account
 * </StyledLink>
 */
type StyledLinkProps = {
  /**
   * If true, renders a native <a> tag instead of react-router Link.
   * Use this for external links.
   */
  external?: boolean;
} & VariantProps<ButtonVariants>;

type InternalLinkProps = StyledLinkProps &
  Omit<React.ComponentProps<typeof RouterLink>, "className"> & {
    className?: string;
    external?: false;
  };

type ExternalLinkProps = StyledLinkProps &
  Omit<React.ComponentProps<"a">, "className"> & {
    className?: string;
    external: true;
  };

export const StyledLink = ({
  className,
  variant,
  size,
  external = false,
  ...props
}: InternalLinkProps | ExternalLinkProps) => {
  const linkClassName = cn(buttonVariants({ variant, size, className }));

  if (external) {
    return (
      <a
        data-slot="styled-link"
        className={linkClassName}
        {...(props as React.ComponentProps<"a">)}
      />
    );
  }

  return (
    <RouterLink
      data-slot="styled-link"
      className={linkClassName}
      {...(props as React.ComponentProps<typeof RouterLink>)}
    />
  );
};
