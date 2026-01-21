import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Info,
  type LucideIcon,
  Mail,
  Megaphone,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { NotificationType } from "shared/interfaces/notification";

/**
 * Maps notification types to their corresponding Lucide icons
 */
export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  [NotificationType.SYSTEM]: Bell,
  [NotificationType.MESSAGE]: MessageCircle,
  [NotificationType.FRIEND_REQUEST]: UserPlus,
  [NotificationType.MENTION]: Mail,
  [NotificationType.ANNOUNCEMENT]: Megaphone,
  [NotificationType.WARNING]: AlertTriangle,
  [NotificationType.SUCCESS]: CheckCircle,
  [NotificationType.INFO]: Info,
};

/**
 * Maps notification types to their badge variant
 */
export const NOTIFICATION_TYPE_VARIANTS: Record<
  NotificationType,
  "default" | "primary" | "destructive" | "success" | "info"
> = {
  [NotificationType.SYSTEM]: "primary",
  [NotificationType.MESSAGE]: "default",
  [NotificationType.FRIEND_REQUEST]: "primary",
  [NotificationType.MENTION]: "primary",
  [NotificationType.ANNOUNCEMENT]: "info",
  [NotificationType.WARNING]: "destructive",
  [NotificationType.SUCCESS]: "success",
  [NotificationType.INFO]: "info",
};

/**
 * Gets the i18n key for a notification type
 */
export const getNotificationTypeI18nKey = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.SYSTEM:
      return "notifications:preferences.types.system";
    case NotificationType.MESSAGE:
      return "notifications:preferences.types.message";
    case NotificationType.FRIEND_REQUEST:
      return "notifications:preferences.types.friend_request";
    case NotificationType.MENTION:
      return "notifications:preferences.types.mention";
    case NotificationType.ANNOUNCEMENT:
      return "notifications:preferences.types.announcement";
    case NotificationType.WARNING:
      return "notifications:preferences.types.warning";
    case NotificationType.SUCCESS:
      return "notifications:preferences.types.success";
    case NotificationType.INFO:
      return "notifications:preferences.types.info";
    default:
      return type;
  }
};

/**
 * Gets the display label for a notification type
 * @param type - The notification type
 * @param t - The i18n translate function
 */
export const getNotificationTypeLabel = (
  type: NotificationType,
  t: (key: string) => string,
): string => {
  return t(getNotificationTypeI18nKey(type));
};
