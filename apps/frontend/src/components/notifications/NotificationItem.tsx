import { useDeleteNotificationMutation } from "@frontend/hooks/api/useDeleteNotificationMutation";
import { useMarkNotificationReadMutation } from "@frontend/hooks/api/useMarkNotificationReadMutation";
import {
  NOTIFICATION_TYPE_ICONS,
  NOTIFICATION_TYPE_VARIANTS,
  getNotificationTypeLabel,
} from "@frontend/lib/notification-icons";
import { formatDistanceToNow } from "date-fns";
import { Badge, Button, ButtonGroup } from "frontend-common/components/ui";
import { cn } from "frontend-common/lib";
import { Mail, MailOpen, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { Notification } from "shared/interfaces/notification";
import { followNotificationAction } from "./url-utils";

interface NotificationItemProps {
  notification: Notification;
  showManagementActions?: boolean;
  managementActionsVariant?: "text" | "icon";
  density?: "default" | "compact";
  onActionSuccess?: () => void;
}

export const NotificationItem = ({
  notification,
  showManagementActions = false,
  managementActionsVariant = "text",
  density = "default",
  onActionSuccess,
}: NotificationItemProps) => {
  const { t } = useTranslation();
  const markReadMutation = useMarkNotificationReadMutation();
  const deleteMutation = useDeleteNotificationMutation();
  const navigate = useNavigate();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate({ id: notification.id });
  };

  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markReadMutation.mutate({ id: notification.id, read: !notification.read });
  };

  const markAsReadIfNeeded = () => {
    if (!notification.read) {
      markReadMutation.mutate({ id: notification.id, read: true });
    }
  };

  const handleActionClick = (
    e: React.MouseEvent,
    action: NonNullable<typeof notification.metadata.actions>[number],
  ) => {
    e.stopPropagation();

    const navigated = followNotificationAction(action, { navigate });

    if (!navigated) {
      return;
    }

    markAsReadIfNeeded();
    onActionSuccess?.();
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });
  const showIconActions = showManagementActions && managementActionsVariant === "icon";
  const toggleReadLabel = notification.read ? "Mark unread" : "Mark read";
  const ToggleReadIcon = notification.read ? Mail : MailOpen;
  const isCompact = density === "compact";
  const actionGroupVariant = notification.metadata?.actionGroupVariant;

  const TypeIcon = NOTIFICATION_TYPE_ICONS[notification.type];
  const typeVariant = NOTIFICATION_TYPE_VARIANTS[notification.type];
  const typeLabel = getNotificationTypeLabel(notification.type, t);

  return (
    <div
      className={cn(
        "group relative transition-colors hover:bg-accent/20",
        isCompact ? "p-3" : "p-4",
        !notification.read && "bg-accent/20",
      )}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-primary",
            "h-2 w-2",
          )}
        />
      )}

      {/* Content */}
      <div
        className={cn(
          isCompact ? "flex gap-2" : "flex gap-3",
          !notification.read && "ml-4",
        )}
      >
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "font-medium leading-none",
                isCompact ? "text-xs" : "text-sm",
              )}
            >
              {notification.title}
            </p>
            <Badge variant={typeVariant} size={isCompact ? "xs" : "sm"}>
              <TypeIcon className={cn("mr-1", isCompact ? "h-2.5 w-2.5" : "h-3 w-3")} />
              {typeLabel}
            </Badge>
          </div>
          <p className={cn("text-muted-foreground", isCompact ? "text-xs" : "text-sm")}>
            {notification.content}
          </p>
          <p
            className={cn("text-muted-foreground", isCompact ? "text-[11px]" : "text-xs")}
          >
            {timeAgo}
          </p>

          {/* Actions */}
          {notification.metadata?.actions &&
            notification.metadata.actions.length > 0 &&
            (actionGroupVariant ? (
              <ButtonGroup
                variant={actionGroupVariant}
                className={cn(isCompact ? "mt-1.5" : "mt-2")}
              >
                {notification.metadata.actions.map((action, index) => (
                  <Button
                    key={`${notification.id}-${action.actionId}-${index}`}
                    variant={action.variant ?? actionGroupVariant ?? "outline"}
                    size={isCompact ? "xs" : "sm"}
                    onClick={(e) => handleActionClick(e, action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </ButtonGroup>
            ) : (
              <div className={cn("flex flex-wrap gap-2", isCompact ? "mt-1.5" : "mt-2")}>
                {notification.metadata.actions.map((action, index) => (
                  <Button
                    key={`${notification.id}-${action.actionId}-${index}`}
                    variant={action.variant ?? "outline"}
                    size={isCompact ? "xs" : "sm"}
                    onClick={(e) => handleActionClick(e, action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            ))}

          {showManagementActions && managementActionsVariant === "text" && (
            <div className={cn("flex flex-wrap gap-2", isCompact ? "mt-1.5" : "mt-2")}>
              <Button
                variant="ghost"
                size={isCompact ? "xs" : "sm"}
                onClick={handleToggleRead}
                disabled={markReadMutation.isPending}
              >
                {toggleReadLabel}
              </Button>
            </div>
          )}
        </div>

        {/* Delete button */}
        {showIconActions ? (
          <ButtonGroup
            className={cn(
              "absolute top-2 right-2 bg-accent-background",
              "shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
            )}
          >
            <Button
              variant="outline"
              size={isCompact ? "xxs" : "md"}
              onClick={handleToggleRead}
              disabled={markReadMutation.isPending}
              aria-label={toggleReadLabel}
            >
              <ToggleReadIcon className={cn(isCompact ? "size-3" : "size-4")} />
            </Button>
            <Button
              variant="outline"
              size={isCompact ? "xxs" : "md"}
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              aria-label="Delete notification"
            >
              <Trash2 className={cn(isCompact ? "size-3" : "size-4")} />
            </Button>
          </ButtonGroup>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
              isCompact ? "h-7 w-7" : "h-8 w-8",
            )}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <X className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} />
          </Button>
        )}
      </div>
    </div>
  );
};
