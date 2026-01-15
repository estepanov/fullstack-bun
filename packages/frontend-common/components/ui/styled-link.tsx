import type { VariantProps } from "class-variance-authority";
import { cn } from "frontend-common/lib";
import type * as React from "react";
import { Link as RouterLink } from "react-router";
import { type LinkVariants, linkVariants } from "./link.variants";

/**
 * StyledLink - A link component with link and button variants
 *
 * Link variants (inline, no padding):
 * - default: Primary colored link with underline on hover
 * - destructive: Destructive colored link with underline on hover
 * - muted: Muted colored link
 * - subtle: Subtle colored link
 *
 * Button variants (full button appearance with padding):
 * - default-button: Primary button style
 * - destructive-button: Destructive button style
 * - outline-button: Outline button style
 * - secondary-button: Secondary button style
 * - ghost-button: Ghost button style
 *
 * @example
 * // Internal link with default link style
 * <StyledLink to="/dashboard">Go to Dashboard</StyledLink>
 *
 * @example
 * // Destructive link style
 * <StyledLink to="/delete" variant="destructive">
 *   Delete Account
 * </StyledLink>
 *
 * @example
 * // External link with muted variant
 * <StyledLink href="https://example.com" external variant="muted">
 *   Visit Example
 * </StyledLink>
 *
 * @example
 * // Link styled as a primary button
 * <StyledLink to="/login" variant="default-button" size="lg">
 *   Sign In
 * </StyledLink>
 *
 * @example
 * // Link styled as a destructive button
 * <StyledLink to="/delete" variant="destructive-button" size="sm">
 *   Delete Account
 * </StyledLink>
 */
type StyledLinkProps = {
  /**
   * If true, renders a native <a> tag instead of react-router Link.
   * Use this for external links.
   */
  external?: boolean;
  className?: string;
} & VariantProps<LinkVariants>;

type InternalLinkProps = StyledLinkProps &
  Omit<React.ComponentProps<typeof RouterLink>, "className"> & {
    className?: string;
    external?: false;
    to: string;
  };

type ExternalLinkProps = StyledLinkProps &
  Omit<React.ComponentProps<"a">, "className"> & {
    className?: string;
    external: true;
    href: string;
  };

export const StyledLink = (props: InternalLinkProps | ExternalLinkProps) => {
  const { className, variant, size, external = false, ...restProps } = props;
  const linkClassName = cn(linkVariants({ variant, size, className }));

  if (external) {
    const { href, ...anchorProps } = restProps as ExternalLinkProps;
    return (
      <a data-slot="styled-link" className={linkClassName} href={href} {...anchorProps} />
    );
  }

  return (
    <RouterLink
      data-slot="styled-link"
      className={linkClassName}
      {...(restProps as InternalLinkProps)}
    />
  );
};
