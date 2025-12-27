import type { VariantProps } from "class-variance-authority";
import { cn } from "frontend-common/lib";
import type * as React from "react";
import { type LabelVariants, labelVariants } from "./label.variants";

export const Label = ({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"label"> & VariantProps<LabelVariants>) => {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: bug our implementation w/ biome?
    <label
      data-slot="label"
      className={cn(labelVariants({ variant, size, className }))}
      {...props}
    />
  );
};
