import { useTranslation } from "react-i18next";
import { DashboardCard } from "./dashboard-card";
import { NameEditor } from "./name-editor";
import { UsernameEditor } from "./username-editor";
import type { UpdateCallback } from "@/types/dashboard";
import type { ExtendedUser } from "@/types/user";
import { LoginMethod } from "shared/auth/login-method";

interface UserInfoSectionProps {
  user: ExtendedUser;
  role?: string | null;
  onUpdated: UpdateCallback;
}

export function UserInfoSection({ user, role, onUpdated }: UserInfoSectionProps) {
  const { t } = useTranslation("auth");

  return (
    <DashboardCard>
      <h2 className="text-xl font-semibold">{t("dashboard.user_info_title")}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <NameEditor name={user.name} onUpdated={onUpdated} />
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("dashboard.email_label")}
          </dt>
          <dd className="mt-1 text-sm text-foreground">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("dashboard.email_verified_label")}
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {user.emailVerified ? (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {t("dashboard.verified_badge")}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                {t("dashboard.not_verified_badge")}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("dashboard.user_id_label")}
          </dt>
          <dd className="mt-1 text-sm text-foreground">{user.id}</dd>
        </div>
        <UsernameEditor
          displayUsername={user.displayUsername}
          onUpdated={onUpdated}
        />
        {role && role !== "user" && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("dashboard.role_label")}
            </dt>
            <dd className="mt-1 text-sm text-foreground">{role}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("dashboard.last_login_method_label")}
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {user.lastLoginMethod ? (
              user.lastLoginMethod === LoginMethod.MAGIC_LINK ? (
                t("dashboard.last_login_method_magic_link")
              ) : user.lastLoginMethod === LoginMethod.PASSKEY ? (
                t("dashboard.last_login_method_passkey")
              ) : (
                user.lastLoginMethod.charAt(0).toUpperCase() +
                user.lastLoginMethod.slice(1)
              )
            ) : (
              <span className="italic">
                {t("dashboard.last_login_method_not_set")}
              </span>
            )}
          </dd>
        </div>
      </dl>
    </DashboardCard>
  );
}
