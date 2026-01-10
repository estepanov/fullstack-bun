import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "frontend-common/lib";
import { badgeVariants, type BadgeVariants } from "./badge.variants";

export const Badge = ({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<BadgeVariants>) => {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
};
