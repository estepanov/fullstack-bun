import { useBannedUsersQuery } from "@admin/hooks/api/useBannedUsersQuery";
import { useUnbanUserMutation } from "@admin/hooks/api/useUnbanUserMutation";
import {
  Alert,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "frontend-common/components/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { PAGINATION_CONFIG } from "shared/config/pagination";
import { toast } from "sonner";

export default function AdminBannedUsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGINATION_CONFIG.defaultPageSize);
  const { data, isPending, error } = useBannedUsersQuery({
    page: currentPage,
    limit: pageSize,
  });
  const unbanUser = useUnbanUserMutation();
  const { t, i18n } = useTranslation("admin");

  const handleUnban = (ban: { id: string; email: string }) => {
    unbanUser.mutate(
      { id: ban.id },
      {
        onSuccess: () => {
          toast.success(t("users.unban_success"), {
            description: t("users.unban_success_description", { user: ban.email }),
          });
        },
        onError(error) {
          console.error(error);
          toast.error(t("users.unban_error"), {
            description: t("users.unban_error_description", { user: ban.email }),
          });
        },
      },
    );
  };

  if (isPending) {
    return (
      <div className="mx-auto max-w-6xl w-full h-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/70 bg-card/90 p-6 text-sm text-muted-foreground shadow-sm shadow-black/5 backdrop-blur">
          {t("bans.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl w-full h-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive shadow-sm shadow-black/5 backdrop-blur">
          {t("bans.load_error")}
        </div>
      </div>
    );
  }

  const bans = data?.bans || [];
  const pagination = data?.pagination;

  return (
    <div className="mx-auto max-w-6xl w-full h-full px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("bans.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("bans.description")}</p>
          </div>
          <Link
            to="/users"
            className="w-full rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto"
          >
            {t("bans.link.view_all_users")}
          </Link>
        </div>

        {bans.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-border/70 bg-background/80 py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <title>{t("bans.empty.icon_title")}</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-foreground">
              {t("bans.empty.title")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("bans.empty.description")}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-border/70">
                <thead className="bg-muted/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("bans.table.user_header")}
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("bans.table.email_header")}
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("bans.table.banned_date_header")}
                    </th>
                    <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("bans.table.reason_header")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("bans.table.actions_header")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 bg-card/80">
                  {bans.map((ban) => (
                    <tr key={ban.id}>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          {ban.image && (
                            <img
                              className="mr-3 h-8 w-8 rounded-full"
                              src={ban.image}
                              alt={ban.name}
                            />
                          )}
                          <span className="font-medium text-foreground">{ban.name}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground md:hidden">
                          {ban.email}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground md:hidden">
                          {new Date(ban.updatedAt).toLocaleDateString(i18n.language, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground lg:hidden">
                          <div>
                            {t("bans.table.reason_header")}:{" "}
                            {ban.banReason || t("bans.table.no_reason")}
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
                        {ban.email}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
                        {new Date(ban.updatedAt).toLocaleDateString(i18n.language, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-sm text-muted-foreground">
                        {ban.banReason ? (
                          <span className="max-w-xs truncate block" title={ban.banReason}>
                            {ban.banReason}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70 italic">
                            {t("bans.table.no_reason")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Button
                          type="button"
                          onClick={() => handleUnban({ id: ban.id, email: ban.email })}
                          disabled={unbanUser.isPending}
                          variant="destructive"
                          size="xs"
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          {t("bans.actions.unban")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination && (
              <div className="mt-6 border-t border-border/70 pt-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {t("bans.pagination.showing", {
                        start: (pagination.page - 1) * pagination.limit + 1,
                        end: Math.min(
                          pagination.page * pagination.limit,
                          pagination.totalCount,
                        ),
                        total: pagination.totalCount,
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="pageSize"
                        className="text-sm text-muted-foreground whitespace-nowrap"
                      >
                        {t("bans.pagination.page_size")}:
                      </Label>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(value) => {
                          setPageSize(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger
                          id="pageSize"
                          variant="subtle"
                          size="md"
                          aria-label={t("bans.pagination.page_size")}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGINATION_CONFIG.pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={!pagination.hasPreviousPage || isPending}
                      >
                        {t("bans.pagination.previous")}
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            return (
                              page === 1 ||
                              page === pagination.totalPages ||
                              Math.abs(page - pagination.page) <= 1
                            );
                          })
                          .map((page, idx, arr) => {
                            const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                            return (
                              <div key={page} className="flex items-center gap-1">
                                {showEllipsisBefore && (
                                  <span className="px-2 text-muted-foreground">...</span>
                                )}
                                <Button
                                  type="button"
                                  variant={page === pagination.page ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  disabled={isPending}
                                  className="min-w-10"
                                >
                                  {page}
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                        }
                        disabled={!pagination.hasNextPage || isPending}
                      >
                        {t("bans.pagination.next")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {unbanUser.isError && (
          <Alert variant="destructive" className="mt-4">
            {t("bans.errors.unban_failed")}
          </Alert>
        )}
      </div>
    </div>
  );
}
