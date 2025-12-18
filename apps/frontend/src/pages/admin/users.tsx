import { AdminRoute } from "@/components/AdminRoute";
import { useAdminUsersQuery } from "@/hooks/api/useAdminUsersQuery";
import { useUpdateUserRoleMutation } from "@/hooks/api/useUpdateUserRoleMutation";
import { UserRole, userRoleSchema } from "shared/auth/user-role";
import { useTranslation } from "react-i18next";

function AdminUsersContent() {
  const { data, isPending, error } = useAdminUsersQuery();
  const updateRole = useUpdateUserRoleMutation();
  const { t } = useTranslation("auth");

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
          <div className="text-sm text-red-700 dark:text-red-400">{t("admin.users.load_error")}</div>
        </div>
      </div>
    );
  }

  const users = data && "users" in data && Array.isArray(data.users) ? data.users : [];

  return (
    <div className="bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("admin.users.title")}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t("admin.users.description")}
          </p>

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
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{u.email}</td>
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
                      {u.emailVerified ? t("admin.users.table.verified_yes") : t("admin.users.table.verified_no")}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-gray-600 dark:text-gray-400" colSpan={4}>
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
        </div>
      </div>
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
