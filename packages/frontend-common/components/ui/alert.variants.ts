import { cva } from "class-variance-authority";

export const alertVariants = cva(
  "relative w-full rounded-2xl border shadow-sm grid gap-1.5",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border/70",
        primary: "bg-primary/10 text-primary border-primary/30",
        success:
          "bg-emerald-500/10 text-emerald-800 border-emerald-500/30 dark:text-emerald-200",
        destructive: "bg-destructive/10 text-destructive border-destructive/30",
        info: "bg-blue-500/10 text-blue-800 border-blue-500/30 dark:text-blue-200",
      },
      size: {
        xs: "px-3 py-2 text-xs",
        sm: "px-3.5 py-2.5 text-sm",
        md: "px-4 py-3 text-sm",
        lg: "px-5 py-4 text-base",
        xl: "px-6 py-5 text-lg",
        default: "px-4 py-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export type AlertVariants = typeof alertVariants;
