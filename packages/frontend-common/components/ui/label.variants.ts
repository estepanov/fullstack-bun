import { cva } from "class-variance-authority";

export const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        subtle: "text-muted-foreground/80",
        required: "text-foreground after:content-['*'] after:ml-0.5 after:text-destructive",
      },
      size: {
        xs: "text-[11px] leading-tight font-semibold uppercase tracking-[0.14em]",
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
        xl: "text-lg",
        default: "text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export type LabelVariants = typeof labelVariants;
