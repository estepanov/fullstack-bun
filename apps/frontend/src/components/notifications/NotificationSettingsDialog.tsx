import { NotificationPreferences } from "@frontend/components/notifications/NotificationPreferences";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "frontend-common/components/ui";
import { Settings } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type NotificationSettingsDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
};

export const NotificationSettingsDialog = ({
  open,
  onOpenChange,
  trigger,
}: NotificationSettingsDialogProps) => {
  const { t } = useTranslation("notifications");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        className="max-h-[85vh] overflow-y-auto"
        closeLabel={t("preferences.dialog.close")}
      >
        <DialogHeader>
          <DialogTitle>{t("preferences.title")}</DialogTitle>
          <DialogDescription>{t("preferences.description")}</DialogDescription>
        </DialogHeader>
        <NotificationPreferences variant="plain" />
      </DialogContent>
    </Dialog>
  );
};

type NotificationSettingsTriggerButtonProps = {
  appearance?: "button" | "icon";
  onClick?: () => void;
};

export const NotificationSettingsTriggerButton = ({
  appearance = "button",
  onClick,
}: NotificationSettingsTriggerButtonProps) => {
  const { t } = useTranslation("notifications");

  if (appearance === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("preferences.open_label")}
        onClick={onClick}
      >
        <Settings className="size-4" />
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" className="gap-2" onClick={onClick}>
      <Settings className="size-4" />
      {t("preferences.open_label")}
    </Button>
  );
};
