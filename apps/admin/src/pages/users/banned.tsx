import { useBannedUsersQuery } from "@/hooks/api/useBannedUsersQuery";
import { useUnbanUserMutation } from "@/hooks/api/useUnbanUserMutation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export default function AdminBannedUsersPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const { data, isPending, error } = useBannedUsersQuery({ page, limit });
  const unbanUser = useUnbanUserMutation();
  const { t, i18n } = useTranslation("admin");

  const handleUnban = (userId: string) => {
    unbanUser.mutate({ id: userId });
  };

  if (isPending) {
    return (
      <div className="app-surface">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border/70 bg-card/90 p-6 text-sm text-muted-foreground shadow-sm shadow-black/5 backdrop-blur">
            {t("bans.loading")}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-surface">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive shadow-sm shadow-black/5 backdrop-blur">
            {t("bans.load_error")}
          </div>
        </div>
      </div>
    );
  }

  const bans = data?.bans || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  return (
    <div className="app-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("bans.title")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("bans.description")}
              </p>
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
                        {t("bans.table.banned_by_header")}
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
                            <span className="font-medium text-foreground">
                              {ban.name}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground md:hidden">
                            {ban.email}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground md:hidden">
                            {ban.bannedAt
                              ? new Date(ban.bannedAt).toLocaleDateString(i18n.language, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : t("bans.table.not_available")}
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground lg:hidden">
                            <div>
                              {t("bans.table.banned_by_header")}:{" "}
                              {ban.bannedByName || t("bans.table.unknown")}
                            </div>
                            <div>
                              {t("bans.table.reason_header")}:{" "}
                              {ban.bannedReason || t("bans.table.no_reason")}
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
                          {ban.email}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
                          {ban.bannedAt
                            ? new Date(ban.bannedAt).toLocaleDateString(i18n.language, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : t("bans.table.not_available")}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-muted-foreground">
                          {ban.bannedByName || t("bans.table.unknown")}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-muted-foreground">
                          {ban.bannedReason ? (
                            <span
                              className="max-w-xs truncate block"
                              title={ban.bannedReason}
                            >
                              {ban.bannedReason}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/70 italic">
                              {t("bans.table.no_reason")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            type="button"
                            onClick={() => handleUnban(ban.id)}
                            disabled={unbanUser.isPending}
                            className="w-full rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                          >
                            {t("bans.actions.unban")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    {t("bans.pagination.summary", {
                      page: pagination.page,
                      totalPages: pagination.totalPages,
                      total: pagination.total,
                    })}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="w-full rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {t("bans.pagination.previous")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pagination.totalPages}
                      className="w-full rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {t("bans.pagination.next")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {unbanUser.isError && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {t("bans.errors.unban_failed")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
