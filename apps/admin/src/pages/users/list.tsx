import { useAdminUsersQuery } from "@/hooks/api/useAdminUsersQuery";
import { useBanUserMutation } from "@/hooks/api/useBanUserMutation";
import { useUnbanUserMutation } from "@/hooks/api/useUnbanUserMutation";
import { useUpdateUserRoleMutation } from "@/hooks/api/useUpdateUserRoleMutation";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { UserRole, userRoleSchema } from "shared/auth/user-role";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const { data, isPending, error } = useAdminUsersQuery();
  const updateRole = useUpdateUserRoleMutation();
  const banUser = useBanUserMutation();
  const unbanUser = useUnbanUserMutation();
  const { t } = useTranslation("admin");
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
        reason: banReason || undefined,
        deleteMessages,
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
      <div className="mx-auto max-w-6xl w-full h-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/70 bg-card/90 p-6 text-sm text-muted-foreground shadow-sm shadow-black/5 backdrop-blur">
          {t("users.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl w-full h-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive shadow-sm shadow-black/5 backdrop-blur">
          {t("users.load_error")}
        </div>
      </div>
    );
  }

  const isBannedUser = (user: { banned?: boolean | null }) => Boolean(user.banned);

  const users = data && "users" in data && Array.isArray(data.users) ? data.users : [];

  return (
    <>
      <div className="mx-auto max-w-6xl w-full h-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("users.title")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("users.description")}
              </p>
            </div>
            <Link
              to="/users/banned"
              className="w-full rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto"
            >
              {t("users.link.view_banned")}
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-border/70">
              <thead className="bg-muted/70">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("users.table.user_header")}
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("users.table.email_header")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("users.table.role_header")}
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("users.table.verified_header")}
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("users.table.status_header")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("users.table.actions_header")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 bg-card/80">
                {users.map((u) => {
                  const userIsBanned = isBannedUser(u);
                  const userIsAdmin = u.role === UserRole.ADMIN;
                  const userIsSelf = session?.user?.id === u.id;
                  const banBlocked = userIsAdmin || userIsSelf;

                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-4 text-sm text-foreground">
                        <div className="font-medium">{u.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground md:hidden">
                          {u.email}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 lg:hidden">
                          {u.emailVerified ? (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                              {t("users.table.verified_yes")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                              {t("users.table.verified_no")}
                            </span>
                          )}
                          {userIsBanned ? (
                            <span className="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                              {t("users.table.status_banned")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                              {t("users.table.status_active")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-sm text-muted-foreground">
                        {u.email}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <select
                          className="w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-auto"
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
                      <td className="hidden lg:table-cell px-4 py-4 text-sm text-muted-foreground">
                        {u.emailVerified
                          ? t("users.table.verified_yes")
                          : t("users.table.verified_no")}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-4 text-sm">
                        {userIsBanned ? (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                            {t("users.table.status_banned")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            {t("users.table.status_active")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {userIsBanned ? (
                          <button
                            type="button"
                            onClick={() => handleUnban(u.id)}
                            disabled={unbanUser.isPending}
                            className="w-full rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                          >
                            {t("users.actions.unban")}
                          </button>
                        ) : banBlocked ? null : (
                          <button
                            type="button"
                            onClick={() => handleBanClick(u.id)}
                            disabled={banUser.isPending}
                            className="w-full rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                          >
                            {t("users.actions.ban_user")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={6}>
                      {t("users.table.no_users")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {updateRole.isError && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {t("users.update_role_error")}
            </div>
          )}

          {banUser.isError && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {t("users.ban_error")}
            </div>
          )}
        </div>
      </div>

      {/* Ban Confirmation Dialog */}
      {banDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
              className="fixed inset-0 bg-black/60 transition-opacity"
              onClick={() => setBanDialogOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setBanDialogOpen(false)}
              role="button"
              tabIndex={0}
              aria-label={t("users.ban_dialog.close_label")}
            />
            <div className="relative transform overflow-hidden rounded-3xl border border-border/70 bg-card/95 text-left shadow-xl backdrop-blur transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-destructive"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <title>{t("users.ban_dialog.icon_title")}</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 flex-1 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-foreground">
                      {t("users.ban_dialog.title")}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        {t("users.ban_dialog.description")}
                      </p>
                      <div className="mt-4">
                        <label
                          htmlFor="ban-reason"
                          className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          {t("users.ban_dialog.reason_label")}
                        </label>
                        <input
                          type="text"
                          id="ban-reason"
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          className="mt-2 block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder={t("users.ban_dialog.reason_placeholder")}
                        />
                      </div>
                      <div className="mt-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={deleteMessages}
                            onChange={(e) => setDeleteMessages(e.target.checked)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                          />
                          <span className="ml-2 text-sm text-muted-foreground">
                            {t("users.ban_dialog.delete_messages_label")}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-border/70 bg-muted/40 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleBanConfirm}
                  disabled={banUser.isPending}
                  className="inline-flex w-full justify-center rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-destructive/90 sm:ml-3 sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {banUser.isPending
                    ? t("users.ban_dialog.confirming_button")
                    : t("users.ban_dialog.confirm_button")}
                </button>
                <button
                  type="button"
                  onClick={() => setBanDialogOpen(false)}
                  disabled={banUser.isPending}
                  className="mt-3 inline-flex w-full justify-center rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted/60 sm:mt-0 sm:w-auto"
                >
                  {t("users.ban_dialog.cancel_button")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
