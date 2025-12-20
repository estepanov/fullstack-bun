import { AdminRoute } from "@/components/AdminRoute";
import { useAdminUsersQuery } from "@/hooks/api/useAdminUsersQuery";
import { useBanUserMutation } from "@/hooks/api/useBanUserMutation";
import { useUnbanUserMutation } from "@/hooks/api/useUnbanUserMutation";
import { useUpdateUserRoleMutation } from "@/hooks/api/useUpdateUserRoleMutation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { UserRole, userRoleSchema } from "shared/auth/user-role";

function AdminUsersContent() {
  const { data, isPending, error } = useAdminUsersQuery();
  const updateRole = useUpdateUserRoleMutation();
  const banUser = useBanUserMutation();
  const unbanUser = useUnbanUserMutation();
  const { t } = useTranslation("auth");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [deleteMessages, setDeleteMessages] = useState(false);

  const handleBanClick = (userId: string) => {
    setSelectedUserId(userId);
    setBanDialogOpen(true);
  };

  const handleBanConfirm = () => {
    if (!selectedUserId) return;
    banUser.mutate(
      {
        id: selectedUserId,
        data: {
          reason: banReason || undefined,
          deleteMessages,
        },
      },
      {
        onSuccess: () => {
          setBanDialogOpen(false);
          setSelectedUserId(null);
          setBanReason("");
          setDeleteMessages(false);
        },
      },
    );
  };

  const handleUnban = (userId: string) => {
    unbanUser.mutate({ id: userId });
  };

  if (isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
          {t("admin.users.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
          <div className="text-sm text-red-700 dark:text-red-400">
            {t("admin.users.load_error")}
          </div>
        </div>
      </div>
    );
  }

  const users = data && "users" in data && Array.isArray(data.users) ? data.users : [];

  return (
    <div className="bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t("admin.users.title")}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t("admin.users.description")}
              </p>
            </div>
            <Link
              to="/admin/bans"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              {t("admin.users.link.view_banned")}
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.users.table.user_header")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.users.table.email_header")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.users.table.role_header")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.users.table.verified_header")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.users.table.status_header")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.users.table.actions_header")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {u.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        value={u.role}
                        disabled={updateRole.isPending}
                        onChange={(e) => {
                          const parsed = userRoleSchema.safeParse(e.target.value);
                          if (!parsed.success) return;
                          updateRole.mutate({ id: u.id, role: parsed.data });
                        }}
                      >
                        {Object.values(UserRole).map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {u.emailVerified
                        ? t("admin.users.table.verified_yes")
                        : t("admin.users.table.verified_no")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {"banned" in u && u.banned ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-300">
                          {t("admin.users.table.status_banned")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                          {t("admin.users.table.status_active")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {"banned" in u && u.banned ? (
                        <button
                          type="button"
                          onClick={() => handleUnban(u.id)}
                          disabled={unbanUser.isPending}
                          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t("admin.users.actions.unban")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBanClick(u.id)}
                          disabled={banUser.isPending}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t("admin.users.actions.ban_user")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-6 text-sm text-gray-600 dark:text-gray-400"
                      colSpan={6}
                    >
                      {t("admin.users.table.no_users")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {updateRole.isError && (
            <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-300">
              {t("admin.users.update_role_error")}
            </div>
          )}

          {banUser.isError && (
            <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-300">
              {t("admin.users.ban_error")}
            </div>
          )}
        </div>
      </div>

      {/* Ban Confirmation Dialog */}
      {banDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setBanDialogOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setBanDialogOpen(false)}
              role="button"
              tabIndex={0}
              aria-label={t("admin.users.ban_dialog.close_label")}
            />
            <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <title>{t("admin.users.ban_dialog.icon_title")}</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
                      {t("admin.users.ban_dialog.title")}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("admin.users.ban_dialog.description")}
                      </p>
                      <div className="mt-4">
                        <label
                          htmlFor="ban-reason"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          {t("admin.users.ban_dialog.reason_label")}
                        </label>
                        <input
                          type="text"
                          id="ban-reason"
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder={t("admin.users.ban_dialog.reason_placeholder")}
                        />
                      </div>
                      <div className="mt-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={deleteMessages}
                            onChange={(e) => setDeleteMessages(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {t("admin.users.ban_dialog.delete_messages_label")}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleBanConfirm}
                  disabled={banUser.isPending}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {banUser.isPending
                    ? t("admin.users.ban_dialog.confirming_button")
                    : t("admin.users.ban_dialog.confirm_button")}
                </button>
                <button
                  type="button"
                  onClick={() => setBanDialogOpen(false)}
                  disabled={banUser.isPending}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                >
                  {t("admin.users.ban_dialog.cancel_button")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminRoute>
      <AdminUsersContent />
    </AdminRoute>
  );
}
