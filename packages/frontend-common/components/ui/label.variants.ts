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
        default: "text-sm",
        xs: "text-xs uppercase tracking-[0.2em] font-semibold",
        sm: "text-xs",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type LabelVariants = typeof labelVariants;
