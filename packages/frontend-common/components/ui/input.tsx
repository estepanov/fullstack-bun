import type * as React from "react";

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "frontend-common/lib";

const inputDescriptionVariants = cva("leading-snug", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      success: "text-emerald-600 dark:text-emerald-300",
      destructive: "text-destructive",
      info: "text-blue-600 dark:text-blue-300",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "xs",
  },
});

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const isCheckbox = type === "checkbox";

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        isCheckbox
          ? "h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          : "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

function InputDescription({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"p"> & VariantProps<typeof inputDescriptionVariants>) {
  return (
    <p
      data-slot="input-description"
      className={cn(inputDescriptionVariants({ variant, size, className }))}
      {...props}
    />
  );
}

function InputError({ className, role = "alert", ...props }: React.ComponentProps<"p">) {
  return (
    <p
      role={role}
      data-slot="input-error"
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    />
  );
}

export { Input, InputDescription, InputError };
