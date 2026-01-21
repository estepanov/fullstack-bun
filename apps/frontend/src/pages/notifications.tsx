import { ProtectedRoute } from "@frontend/components/ProtectedRoute";
import { NotificationItem } from "@frontend/components/notifications/NotificationItem";
import { useDeleteAllNotificationsMutation } from "@frontend/hooks/api/useDeleteAllNotificationsMutation";
import { useGetNotificationCountsQuery } from "@frontend/hooks/api/useGetNotificationCountsQuery";
import { useGetNotificationsQuery } from "@frontend/hooks/api/useGetNotificationsQuery";
import { useMarkAllReadMutation } from "@frontend/hooks/api/useMarkAllReadMutation";
import {
  NOTIFICATION_TYPE_ICONS,
  getNotificationTypeLabel,
} from "@frontend/lib/notification-icons";
import { useNotifications } from "@frontend/providers/NotificationProvider";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "frontend-common/components/ui";
import { CheckCircle, Circle, Inbox, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import {
  type ListNotificationsResponse,
  type Notification,
  NotificationType,
} from "shared/interfaces/notification";

const STATUS_OPTIONS = [
  { value: "all", i18nKey: "notifications:page.filters.status.all", icon: Inbox },
  { value: "unread", i18nKey: "notifications:page.filters.status.unread", icon: Circle },
  { value: "read", i18nKey: "notifications:page.filters.status.read", icon: CheckCircle },
] as const;

const PAGE_SIZE = 20;

export const NotificationsPageContent = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { unreadCount } = useNotifications();
  const markAllReadMutation = useMarkAllReadMutation();
  const deleteAllMutation = useDeleteAllNotificationsMutation();
  const { data: countsData } = useGetNotificationCountsQuery();

  const rawStatus = searchParams.get("status") as
    | (typeof STATUS_OPTIONS)[number]["value"]
    | null;
  const status = STATUS_OPTIONS.some((option) => option.value === rawStatus)
    ? rawStatus
    : "all";
  const rawType = searchParams.get("type") as NotificationType | null;
  const type =
    rawType && Object.values(NotificationType).includes(rawType) ? rawType : undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const searchQuery = searchParams.get("q")?.trim() ?? "";

  const counts = countsData?.success ? countsData.counts : undefined;
  const isNotificationsResponse = (
    value: unknown,
  ): value is ListNotificationsResponse => {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Partial<ListNotificationsResponse>;
    return candidate.success === true && Array.isArray(candidate.notifications);
  };

  // Show all notification types from the enum, not just ones with counts > 0
  const allTypes = useMemo(() => {
    return Object.values(NotificationType).sort();
  }, []);

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (!value) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (searchValue !== searchQuery) {
      const timer = setTimeout(() => {
        updateSearchParams({ q: searchValue.trim() || null, page: "1" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchValue, searchQuery, updateSearchParams]);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  const { data, isLoading, isFetching } = useGetNotificationsQuery({
    page,
    limit: PAGE_SIZE,
    filter: status ?? "all",
    type,
    search: searchQuery || undefined,
  });

  const isNotificationsData = isNotificationsResponse(data);
  const notifications: Notification[] = isNotificationsData ? data.notifications : [];
  const pagination = isNotificationsData ? data.pagination : undefined;

  useEffect(() => {
    if (pagination && pagination.totalPages > 0 && page > pagination.totalPages) {
      updateSearchParams({ page: String(pagination.totalPages) });
    }
  }, [pagination, page, updateSearchParams]);

  const hasNotifications = notifications.length > 0;
  const isFiltering = Boolean(searchQuery) || status !== "all" || Boolean(type);
  const canMarkAllRead = unreadCount > 0 && !markAllReadMutation.isPending;
  const canDeleteAll = hasNotifications && !deleteAllMutation.isPending;

  const resultsSummary = useMemo(() => {
    if (!pagination) return null;
    return t("notifications:page.notifications_count", {
      count: pagination.totalCount,
    });
  }, [pagination, t]);

  return (
    <div className="app-surface flex-1">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("notifications:page.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("notifications:page.description")}
            </p>
          </div>
          {resultsSummary && (
            <div className="text-sm text-muted-foreground">
              {isFetching ? t("notifications:page.updating") : resultsSummary}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium" htmlFor="notification-search">
                {t("notifications:page.search.label")}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="notification-search"
                  value={searchValue}
                  placeholder={t("notifications:page.search.placeholder")}
                  onChange={(event) => setSearchValue(event.target.value)}
                  className="pl-9 pr-10"
                />
                {searchValue && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={() => setSearchValue("")}
                    aria-label={t("notifications:page.search.clear")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="w-full space-y-2 lg:w-52">
              <label className="text-sm font-medium" htmlFor="notification-status">
                {t("notifications:page.filters.status.label")}
              </label>
              <Select
                value={status ?? undefined}
                onValueChange={(value) =>
                  updateSearchParams({ status: value, page: "1" })
                }
              >
                <SelectTrigger id="notification-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const count = counts?.byStatus[option.value] ?? 0;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{t(option.i18nKey)}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            ({count})
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full space-y-2 lg:w-52">
              <label className="text-sm font-medium" htmlFor="notification-type">
                {t("notifications:page.filters.type.label")}
              </label>
              <Select
                value={type ?? "all"}
                onValueChange={(value) =>
                  updateSearchParams({ type: value === "all" ? null : value, page: "1" })
                }
              >
                <SelectTrigger id="notification-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-4 w-4" />
                      <span>{t("notifications:page.filters.type.all_types")}</span>
                      {counts?.byStatus.all !== undefined && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          ({counts.byStatus.all})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                  {allTypes.map((notifType) => {
                    const Icon = NOTIFICATION_TYPE_ICONS[notifType];
                    const count = counts?.byType[notifType] ?? 0;
                    return (
                      <SelectItem key={notifType} value={notifType}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{getNotificationTypeLabel(notifType, t)}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            ({count})
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-wrap gap-2 lg:justify-end">
              <Button
                variant="outline"
                onClick={() => markAllReadMutation.mutate()}
                disabled={!canMarkAllRead}
              >
                {t("notifications:page.actions.mark_all_read")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={!canDeleteAll}
              >
                {t("notifications:page.actions.delete_all")}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">
              {t("notifications:page.loading")}
            </div>
          ) : !hasNotifications ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <p className="text-sm font-medium">
                {isFiltering
                  ? t("notifications:page.empty.no_matching")
                  : t("notifications:page.empty.no_notifications")}
              </p>
              <p className="text-sm text-muted-foreground">
                {isFiltering
                  ? t("notifications:page.empty.description_filtered")
                  : t("notifications:page.empty.description_empty")}
              </p>
              {isFiltering && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchValue("");
                    updateSearchParams({ status: "all", type: null, q: null, page: "1" });
                  }}
                >
                  {t("notifications:page.actions.reset_filters")}
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  showManagementActions
                  managementActionsVariant="icon"
                />
              ))}
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t("notifications:page.pagination.page_of", {
                page: pagination.page,
                total: pagination.totalPages,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPreviousPage}
                onClick={() => updateSearchParams({ page: String(page - 1) })}
              >
                {t("notifications:page.pagination.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => updateSearchParams({ page: String(page + 1) })}
              >
                {t("notifications:page.pagination.next")}
              </Button>
            </div>
          </div>
        )}

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("notifications:page.delete_dialog.title")}</DialogTitle>
              <DialogDescription>
                {t("notifications:page.delete_dialog.description")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                {t("notifications:page.delete_dialog.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteAllMutation.mutate();
                  setShowDeleteConfirm(false);
                }}
              >
                {t("notifications:page.delete_dialog.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsPageContent />
    </ProtectedRoute>
  );
}
