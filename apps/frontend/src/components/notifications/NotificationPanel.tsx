import { useDeleteAllNotificationsMutation } from "@frontend/hooks/api/useDeleteAllNotificationsMutation";
import { useMarkAllReadMutation } from "@frontend/hooks/api/useMarkAllReadMutation";
import { useNotifications } from "@frontend/providers/NotificationProvider";
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  StyledLink,
} from "frontend-common/components/ui";
import { CheckCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NotificationItem } from "./NotificationItem";

interface NotificationPanelProps {
  onClose?: () => void;
}

export const NotificationPanel = ({ onClose }: NotificationPanelProps) => {
  const { t } = useTranslation("notifications");
  const { notifications, unreadCount } = useNotifications();
  const markAllReadMutation = useMarkAllReadMutation();
  const deleteAllMutation = useDeleteAllNotificationsMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleDeleteAll = () => {
    deleteAllMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const hasNotifications = notifications.length > 0;

  return (
    <>
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-2 md:p-4">
          <h3 className="text-base font-semibold">{t("panel.title")}</h3>
          {hasNotifications && (
            <ButtonGroup>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleMarkAllRead}
                  disabled={markAllReadMutation.isPending}
                  title={t("panel.actions.markAllRead")}
                >
                  <CheckCheck className="size-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteAllMutation.isPending}
                title={t("panel.actions.deleteAll")}
              >
                <Trash2 className="size-4" />
              </Button>
            </ButtonGroup>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-[360px] overflow-y-auto">
          {!hasNotifications ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="text-muted-foreground">
                <p className="text-xs">{t("panel.empty.heading")}</p>
                <p className="mt-1 text-[11px]">{t("panel.empty.description")}</p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  showManagementActions
                  managementActionsVariant="icon"
                  density="compact"
                  onActionSuccess={onClose}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {hasNotifications && (
          <div className="border-t text-center py-2">
            <StyledLink to="/notifications" onClick={onClose} size="sm">
              {t("panel.actions.viewAll")}
            </StyledLink>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("panel.dialog.title")}</DialogTitle>
            <DialogDescription>{t("panel.dialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              {t("panel.dialog.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll}>
              {t("panel.dialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
