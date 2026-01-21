import { NOTIFICATION_ACTION_ALLOWED_DOMAINS } from "shared/config/notification";
import type { NotificationAction } from "shared/interfaces/notification";

const getClientOrigin = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost";
};

export type NotificationUrlInfo = {
  resolvedUrl: URL;
  hostname: string;
  isSameOrigin: boolean;
  isAllowedDomain: boolean;
};

export const resolveNotificationActionUrl = (url: string): NotificationUrlInfo | null => {
  if (!url) {
    return null;
  }

  try {
    const origin = getClientOrigin();
    const resolvedUrl = new URL(url, origin);
    const hostname = resolvedUrl.hostname;
    const isSameOrigin = resolvedUrl.origin === origin;
    const isAllowedDomain = NOTIFICATION_ACTION_ALLOWED_DOMAINS.includes(hostname);

    return {
      resolvedUrl,
      hostname,
      isSameOrigin,
      isAllowedDomain,
    };
  } catch {
    return null;
  }
};

export const isTrustedNotificationUrl = (info: NotificationUrlInfo) =>
  info.isSameOrigin || info.isAllowedDomain;

export const confirmExternalNotificationNavigation = (hostname: string) => {
  if (typeof window === "undefined" || typeof window.confirm !== "function") {
    return true;
  }

  return window.confirm(
    `You are about to leave this site and visit ${hostname}. Do you want to continue?`,
  );
};

export const openNotificationUrlInNewTab = (resolvedUrl: URL) => {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof document === "undefined") {
    window.open(resolvedUrl.toString(), "_blank", "noopener,noreferrer");
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = resolvedUrl.toString();
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.click();
};

const getPathnameWithSearch = (resolvedUrl: URL) =>
  `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;

type FollowNotificationActionOptions = {
  navigate: (path: string) => void;
};

export const followNotificationAction = (
  action: NotificationAction,
  { navigate }: FollowNotificationActionOptions,
) => {
  const info = resolveNotificationActionUrl(action.url);
  if (!info) {
    console.warn("Skipping invalid notification URL:", action.url);
    return false;
  }

  if (!isTrustedNotificationUrl(info)) {
    console.warn("Blocked notification URL:", info.resolvedUrl.toString());
    return false;
  }

  const targetsExternalHost = !info.isSameOrigin;
  if (targetsExternalHost && !confirmExternalNotificationNavigation(info.hostname)) {
    return false;
  }

  if (action.openInNewTab) {
    openNotificationUrlInNewTab(info.resolvedUrl);
  } else if (info.isSameOrigin) {
    navigate(getPathnameWithSearch(info.resolvedUrl));
  } else {
    window.location.assign(info.resolvedUrl.toString());
  }

  return true;
};
