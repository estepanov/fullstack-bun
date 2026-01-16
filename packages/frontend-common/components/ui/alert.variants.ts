import { cva } from "class-variance-authority";

export const alertVariants = cva("relative rounded-2xl border shadow-sm grid gap-1.5", {
  variants: {
    variant: {
      default: "bg-card text-card-foreground border-border/70",
      primary: "bg-primary/10 text-primary border-primary/30",
      success: "bg-success-background text-success-foreground border-success-border",
      destructive: "bg-destructive-background text-destructive border-destructive-border",
      info: "bg-info-background text-info-foreground border-info-border",
      warning: "bg-warning-background text-warning-foreground border-warning-border",
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
});

export type AlertVariants = typeof alertVariants;
