import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full font-semibold whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-primary/10 text-primary",
        success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        destructive: "bg-destructive/10 text-destructive",
        info: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
      },
      size: {
        xs: "px-2 py-0.5 text-[11px] leading-tight",
        sm: "px-2.5 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-3.5 py-1.5 text-base",
        xl: "px-4 py-2 text-lg",
        default: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export type BadgeVariants = typeof badgeVariants;
