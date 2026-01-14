import * as LabelPrimitive from "@radix-ui/react-label";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "frontend-common/lib";

import { type LabelVariants, labelVariants } from "./label.variants";

function Label({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & VariantProps<LabelVariants>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(labelVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Label };
