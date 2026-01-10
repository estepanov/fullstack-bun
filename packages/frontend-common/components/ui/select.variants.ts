import { cva } from "class-variance-authority";

export const selectVariants = cva(
  "border-input text-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 w-full min-w-0 border bg-transparent shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-md",
        soft: "rounded-xl border-border/70 bg-background/80",
        subtle: "rounded-lg border-border/70 bg-background/80",
        ghost: "rounded-lg border-border/50 bg-transparent",
      },
      size: {
        xs: "h-7 px-2.5 py-1 text-xs",
        sm: "h-8 px-3 py-1.5 text-sm",
        md: "h-9 px-3 py-2 text-sm",
        lg: "h-10 px-4 py-2.5 text-base",
        default: "h-9 px-3 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export type SelectVariants = typeof selectVariants;
