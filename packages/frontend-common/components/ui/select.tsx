import type { VariantProps } from "class-variance-authority";
import { cn } from "frontend-common/lib";
import type * as React from "react";
import { type SelectVariants, selectVariants } from "./select.variants";

type SelectProps = Omit<React.ComponentProps<"select">, "size"> &
  VariantProps<SelectVariants>;

export const Select = ({ className, variant, size, ...props }: SelectProps) => {
  return (
    <select
      data-slot="select"
      className={cn(selectVariants({ variant, size, className }))}
      {...props}
    />
  );
};
