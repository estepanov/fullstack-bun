import { useMarkNotificationReadMutation } from "@frontend/hooks/api/useMarkNotificationReadMutation";
import {
  type UseNotificationSSEReturn,
  useNotificationSSE,
} from "@frontend/hooks/api/useNotificationSSE";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "frontend-common/components/ui";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { NotificationAction } from "shared/interfaces/notification";
import { toast } from "sonner";
import { followNotificationAction } from "../components/notifications/url-utils";

const NotificationContext = createContext<UseNotificationSSEReturn | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const notificationState = useNotificationSSE();
  const navigate = useNavigate();
  const lastShownNotificationIdRef = useRef<string | null>(null);
  const markNotificationRead = useMarkNotificationReadMutation();
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openNotificationModal = useCallback((notificationId: string) => {
    setSelectedNotificationId(notificationId);
    setIsDialogOpen(true);
  }, []);

  const closeNotificationModal = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedNotificationId(null);
  }, []);

  // Show toast for new unread notifications
  useEffect(() => {
    const { notifications } = notificationState;

    if (notifications.length === 0) {
      return;
    }

    // Get the most recent notification
    const latestNotification = notifications[0];
    const actions = latestNotification.metadata?.actions;
    const singleAction = actions && actions.length === 1 ? actions[0] : null;

    // Only show toast for unread notifications that haven't been shown yet
    if (
      !latestNotification.read &&
      latestNotification.id !== lastShownNotificationIdRef.current
    ) {
      lastShownNotificationIdRef.current = latestNotification.id;

      const markAsReadIfNeeded = () => {
        if (!latestNotification.read) {
          markNotificationRead.mutate({ id: latestNotification.id, read: true });
        }
      };

      const handleSingleActionClick = () => {
        if (!singleAction) {
          return;
        }

        const navigated = followNotificationAction(singleAction, { navigate });
        if (!navigated) {
          return;
        }

        markAsReadIfNeeded();
      };

      toast(latestNotification.title, {
        description: latestNotification.content,
        duration: 5000,
        action:
          actions && actions.length > 1
            ? {
                label: t("notifications:toast.view_details"),
                onClick: () => openNotificationModal(latestNotification.id),
              }
            : singleAction
              ? {
                  label: singleAction.label,
                  onClick: handleSingleActionClick,
                }
              : undefined,
      });
    }
  }, [markNotificationRead, navigate, notificationState, openNotificationModal, t]);

  const selectedNotification = notificationState.notifications.find(
    (notification) => notification.id === selectedNotificationId,
  );

  const handleModalActionClick = (action: NotificationAction) => {
    if (!selectedNotification) {
      return;
    }

    const markAsReadIfNeeded = () => {
      if (!selectedNotification.read) {
        markNotificationRead.mutate({ id: selectedNotification.id, read: true });
      }
    };

    const navigated = followNotificationAction(action, { navigate });
    if (!navigated) {
      return;
    }

    markAsReadIfNeeded();
    closeNotificationModal();
  };

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}

      {selectedNotification && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeNotificationModal();
            } else {
              setIsDialogOpen(true);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedNotification.title}</DialogTitle>
              <DialogDescription>{selectedNotification.content}</DialogDescription>
            </DialogHeader>

            {selectedNotification.metadata?.actions?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedNotification.metadata.actions.map((action) => (
                  <Button
                    key={`${selectedNotification.id}-${action.actionId}`}
                    size="sm"
                    variant={action.variant ?? "outline"}
                    onClick={() => handleModalActionClick(action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("notifications:toast.no_actions")}
              </p>
            )}

            <DialogFooter>
              <Button variant="secondary" onClick={closeNotificationModal}>
                {t("notifications:panel.dialog.cancel")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): UseNotificationSSEReturn => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
