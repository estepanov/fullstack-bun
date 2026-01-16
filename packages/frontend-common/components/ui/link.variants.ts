import { cva } from "class-variance-authority";

export const linkVariants = cva(
  "inline-flex items-center gap-2 whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-2 cursor-pointer disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "text-primary underline-offset-4 hover:underline",
        destructive: "text-destructive underline-offset-4 hover:underline",
        muted:
          "text-muted-foreground underline-offset-4 hover:underline hover:text-foreground",
        subtle:
          "text-foreground/70 underline-offset-4 hover:underline hover:text-foreground",

        // Button-style variants (full button appearance)
        "default-button":
          "justify-center rounded-full bg-primary text-primary-foreground shadow-xs hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "destructive-button":
          "justify-center rounded-full bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        "outline-button":
          "justify-center rounded-full border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "secondary-button":
          "justify-center rounded-full bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "ghost-button":
          "justify-center rounded-full hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      },
      size: {
        xs: "text-[11px] leading-tight",
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
        xl: "text-lg",
        default: "text-sm",
      },
    },
    compoundVariants: [
      // Add button-specific sizing (height and padding) only for button variants
      {
        variant: [
          "default-button",
          "destructive-button",
          "outline-button",
          "secondary-button",
          "ghost-button",
        ],
        size: "xs",
        class: "h-7 gap-1.5 px-3 has-[>svg]:px-2.5",
      },
      {
        variant: [
          "default-button",
          "destructive-button",
          "outline-button",
          "secondary-button",
          "ghost-button",
        ],
        size: "sm",
        class: "h-8 gap-1.5 px-3.5 has-[>svg]:px-3",
      },
      {
        variant: [
          "default-button",
          "destructive-button",
          "outline-button",
          "secondary-button",
          "ghost-button",
        ],
        size: ["md", "default"],
        class: "h-9 px-4 py-2 has-[>svg]:px-3",
      },
      {
        variant: [
          "default-button",
          "destructive-button",
          "outline-button",
          "secondary-button",
          "ghost-button",
        ],
        size: "lg",
        class: "h-10 gap-2 px-5 has-[>svg]:px-4",
      },
      {
        variant: [
          "default-button",
          "destructive-button",
          "outline-button",
          "secondary-button",
          "ghost-button",
        ],
        size: "xl",
        class: "h-11 gap-2.5 px-6 has-[>svg]:px-5",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export type LinkVariants = typeof linkVariants;
