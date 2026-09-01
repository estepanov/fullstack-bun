import { NotificationPreferences } from "@frontend/components/notifications/NotificationPreferences";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "frontend-common/components/ui";
import { Settings } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type NotificationSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const NotificationSettingsDialog = ({
  open,
  onOpenChange,
}: NotificationSettingsDialogProps) => {
  const { t } = useTranslation("notifications");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="grid max-h-[85vh] gap-4 overflow-y-auto"
        closeLabel={t("preferences.dialog.close")}
      >
        <DialogHeader>
          <DialogTitle>{t("preferences.title")}</DialogTitle>
          <DialogDescription>{t("preferences.description")}</DialogDescription>
        </DialogHeader>
        <NotificationPreferences />
      </DialogContent>
    </Dialog>
  );
};

type NotificationSettingsTriggerButtonProps = {
  appearance?: "button" | "icon";
  onClick: () => void;
};

export const NotificationSettingsTriggerButton = ({
  appearance = "button",
  onClick,
}: NotificationSettingsTriggerButtonProps) => {
  const { t } = useTranslation("notifications");
  const label = t("preferences.open_label");

  return (
    <Button
      type="button"
      variant={appearance === "icon" ? "ghost" : "outline"}
      size={appearance === "icon" ? "icon" : "default"}
      className={appearance === "icon" ? undefined : "gap-2"}
      aria-label={label}
      onClick={onClick}
    >
      <Settings className="size-4" />
      {appearance === "button" ? label : null}
    </Button>
  );
};

export const NotificationSettingsButton = ({
  appearance = "button",
}: {
  appearance?: "button" | "icon";
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <NotificationSettingsTriggerButton
        appearance={appearance}
        onClick={() => setOpen(true)}
      />
      <NotificationSettingsDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
