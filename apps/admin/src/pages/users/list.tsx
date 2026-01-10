import { useAdminUsersQuery } from "@/hooks/api/useAdminUsersQuery";
import { useBanUserMutation } from "@/hooks/api/useBanUserMutation";
import { useUnbanUserMutation } from "@/hooks/api/useUnbanUserMutation";
import { useUpdateUserRoleMutation } from "@/hooks/api/useUpdateUserRoleMutation";
import { useSession } from "@/lib/auth-client";
import {
  Badge,
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "frontend-common/components/ui";
import { CheckIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { UserRole, userRoleSchema } from "shared/auth/user-role";
import { PAGINATION_CONFIG } from "shared/config/pagination";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGINATION_CONFIG.defaultPageSize);
  const { data, isPending, error } = useAdminUsersQuery({
    page: currentPage,
    limit: pageSize,
  });
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

  const users = data?.users || [];
  const pagination = data?.pagination;

  const EmailStatusBadge = ({
    verified,
    size = "sm",
  }: {
    verified: boolean;
    size?: "xs" | "sm";
  }) => {
    const label = verified ? t("users.table.verified_yes") : t("users.table.verified_no");
    const description = verified
      ? t("users.table.verified_description")
      : t("users.table.unverified_description");

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge
            variant={verified ? "success" : "default"}
            size={size}
            className="cursor-help"
            aria-label={label}
          >
            {verified ? (
              <CheckIcon className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <XIcon className="h-3.5 w-3.5" aria-hidden />
            )}
          </Badge>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-64">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">{label}</div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

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
                        <div className="flex items-center gap-2">
                          {u.name ? (
                            <span className="font-medium">{u.name}</span>
                          ) : (
                            <span className="text-muted-foreground/70 italic">
                              {t("users.table.name_not_provided")}
                            </span>
                          )}
                          {userIsSelf && (
                            <Badge variant="info" size="sm">
                              {t("users.table.you_badge")}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground md:hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{u.email}</span>
                            <EmailStatusBadge verified={u.emailVerified} size="xs" />
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 lg:hidden">
                          {userIsBanned ? (
                            <Badge variant="destructive">
                              {t("users.table.status_banned")}
                            </Badge>
                          ) : (
                            <Badge variant="success">
                              {t("users.table.status_active")}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>{u.email}</span>
                          <EmailStatusBadge verified={u.emailVerified} size="xs" />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <Select
                          value={u.role}
                          disabled={updateRole.isPending}
                          onValueChange={(value) => {
                            const parsed = userRoleSchema.safeParse(value);
                            if (!parsed.success) return;
                            updateRole.mutate({ id: u.id, role: parsed.data });
                          }}
                        >
                          <SelectTrigger
                            className="w-full sm:w-auto"
                            variant="soft"
                            size="md"
                            aria-label={t("users.table.role_header")}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(UserRole).map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-4 text-sm">
                        {userIsBanned ? (
                          <Badge variant="destructive">
                            {t("users.table.status_banned")}
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            {t("users.table.status_active")}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {userIsBanned ? (
                          <Button
                            type="button"
                            onClick={() => handleUnban(u.id)}
                            disabled={unbanUser.isPending}
                            size="xs"
                            variant="ghost"
                            className="w-full sm:w-auto"
                          >
                            {t("users.actions.unban")}
                          </Button>
                        ) : banBlocked ? null : (
                          <Button
                            type="button"
                            onClick={() => handleBanClick(u.id)}
                            disabled={banUser.isPending}
                            variant="destructive"
                            size="xs"
                            className="w-full sm:w-auto"
                          >
                            {t("users.actions.ban_user")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                      {t("users.table.no_users")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination && (
            <div className="mt-6 border-t border-border/70 pt-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {t("users.pagination.showing", {
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
                      htmlFor="page-size"
                      className="text-sm text-muted-foreground whitespace-nowrap"
                    >
                      {t("users.pagination.page_size")}:
                    </Label>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger
                        id="page-size"
                        variant="subtle"
                        size="sm"
                        aria-label={t("users.pagination.page_size")}
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
                      {t("users.pagination.previous")}
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first page, last page, current page, and pages around current
                          return (
                            page === 1 ||
                            page === pagination.totalPages ||
                            Math.abs(page - pagination.page) <= 1
                          );
                        })
                        .map((page, idx, arr) => {
                          // Add ellipsis if there's a gap
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
                      {t("users.pagination.next")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

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
                        <Label htmlFor="ban-reason" size="xs">
                          {t("users.ban_dialog.reason_label")}
                        </Label>
                        <Input
                          type="text"
                          id="ban-reason"
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          className="mt-2 block w-full"
                          placeholder={t("users.ban_dialog.reason_placeholder")}
                        />
                      </div>
                      <div className="mt-4">
                        <Label className="flex items-center">
                          <Input
                            type="checkbox"
                            checked={deleteMessages}
                            onChange={(e) => setDeleteMessages(e.target.checked)}
                          />
                          <span className="ml-2 text-sm text-muted-foreground">
                            {t("users.ban_dialog.delete_messages_label")}
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-border/70 bg-muted/40 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <Button
                  type="button"
                  onClick={handleBanConfirm}
                  disabled={banUser.isPending}
                  variant="destructive"
                  className="w-full sm:ml-3 sm:w-auto"
                >
                  {banUser.isPending
                    ? t("users.ban_dialog.confirming_button")
                    : t("users.ban_dialog.confirm_button")}
                </Button>
                <Button
                  type="button"
                  onClick={() => setBanDialogOpen(false)}
                  disabled={banUser.isPending}
                  variant="outline"
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  {t("users.ban_dialog.cancel_button")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
