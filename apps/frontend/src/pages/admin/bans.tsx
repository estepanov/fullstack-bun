import { AdminRoute } from "@/components/AdminRoute";
import { useBannedUsersQuery } from "@/hooks/api/useBannedUsersQuery";
import { useUnbanUserMutation } from "@/hooks/api/useUnbanUserMutation";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link } from "react-router";

function AdminBansContent() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const { data, isPending, error } = useBannedUsersQuery({ page, limit });
  const unbanUser = useUnbanUserMutation();
  const { t, i18n } = useTranslation("auth");

  const handleUnban = (userId: string) => {
    unbanUser.mutate({ id: userId });
  };

  if (isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
          {t("admin.bans.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
          <div className="text-sm text-red-700 dark:text-red-400">
            {t("admin.bans.load_error")}
          </div>
        </div>
      </div>
    );
  }

  const bans = data?.bans || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  return (
    <div className="bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t("admin.bans.title")}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t("admin.bans.description")}
              </p>
            </div>
            <Link
              to="/admin/users"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              {t("admin.bans.link.view_all_users")}
            </Link>
          </div>

          {bans.length === 0 ? (
            <div className="mt-6 text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <title>{t("admin.bans.empty.icon_title")}</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                {t("admin.bans.empty.title")}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("admin.bans.empty.description")}
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("admin.bans.table.user_header")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("admin.bans.table.email_header")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("admin.bans.table.banned_date_header")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("admin.bans.table.banned_by_header")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("admin.bans.table.reason_header")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("admin.bans.table.actions_header")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {bans.map((ban) => (
                      <tr key={ban.id}>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center">
                            {ban.image && (
                              <img
                                className="h-8 w-8 rounded-full mr-3"
                                src={ban.image}
                                alt={ban.name}
                              />
                            )}
                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                              {ban.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {ban.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {ban.bannedAt
                            ? new Date(ban.bannedAt).toLocaleDateString(i18n.language, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : t("admin.bans.table.not_available")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {ban.bannedByName || t("admin.bans.table.unknown")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {ban.bannedReason ? (
                            <span className="max-w-xs truncate block" title={ban.bannedReason}>
                              {ban.bannedReason}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic">
                              {t("admin.bans.table.no_reason")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            type="button"
                            onClick={() => handleUnban(ban.id)}
                            disabled={unbanUser.isPending}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t("admin.bans.actions.unban")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {t("admin.bans.pagination.summary", {
                      page: pagination.page,
                      totalPages: pagination.totalPages,
                      total: pagination.total,
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("admin.bans.pagination.previous")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pagination.totalPages}
                      className="rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("admin.bans.pagination.next")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {unbanUser.isError && (
            <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-300">
              {t("admin.bans.errors.unban_failed")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminBansPage() {
  return (
    <AdminRoute>
      <AdminBansContent />
    </AdminRoute>
  );
}
