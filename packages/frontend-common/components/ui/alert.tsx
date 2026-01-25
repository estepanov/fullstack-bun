import type { VariantProps } from "class-variance-authority";
import { cn } from "frontend-common/lib";
import type * as React from "react";
import { type AlertVariants, alertVariants } from "./alert.variants";

export const Alert = ({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<AlertVariants>) => {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, size, className }))}
      {...props}
    />
  );
};

export const AlertTitle = ({ className, ...props }: React.ComponentProps<"h5">) => {
  return (
    <h5
      data-slot="alert-title"
      className={cn("font-semibold leading-none", className)}
      {...props}
    />
  );
};

export const AlertDescription = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-current/80 leading-relaxed", className)}
      {...props}
    />
  );
};
