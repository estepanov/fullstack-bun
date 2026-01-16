import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      duration={5000}
      visibleToasts={4}
      icons={{
        success: <CircleCheckIcon className="size-6" />,
        info: <InfoIcon className="size-6" />,
        warning: <TriangleAlertIcon className="size-6" />,
        error: <OctagonXIcon className="size-6" />,
        loading: <Loader2Icon className="size-6 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "shadow-sm",
          icon: "pr-6",
          title: "text-base font-medium",
          description: "text-sm text-muted-foreground",
          closeButton: "text-sm font-medium",
          cancelButton: "text-sm font-medium",
          content: "flex flex-col gap-2 w-full",
        },
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--color-muted)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--success-background)",
          "--success-text": "var(--success)",
          "--success-border": "var(--success-border)",
          "--info-bg": "var(--info-background)",
          "--info-text": "var(--info)",
          "--info-border": "var(--info-border)",
          "--warning-bg": "var(--warning-background)",
          "--warning-text": "var(--warning)",
          "--warning-border": "var(--warning-border)",
          "--error-bg": "var(--destructive-background)",
          "--error-text": "var(--destructive)",
          "--error-border": "var(--destructive-border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
