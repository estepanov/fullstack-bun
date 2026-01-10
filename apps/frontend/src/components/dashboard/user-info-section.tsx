import type { UpdateCallback } from "@/types/dashboard";
import type { ExtendedUser } from "@/types/user";
import { CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LoginMethod } from "shared/auth/login-method";
import { Badge } from "../ui";
import { DashboardCard } from "./dashboard-card";
import { NameEditor } from "./name-editor";
import { UsernameEditor } from "./username-editor";

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
              <Badge variant="success" size="sm" className="gap-1">
                <CheckIcon className="h-4 w-4" />
                {t("dashboard.verified_badge")}
              </Badge>
            ) : (
              <Badge variant="destructive">{t("dashboard.not_verified_badge")}</Badge>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("dashboard.user_id_label")}
          </dt>
          <dd className="mt-1 text-sm text-foreground">{user.id}</dd>
        </div>
        <UsernameEditor displayUsername={user.displayUsername} onUpdated={onUpdated} />
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
              <span className="italic">{t("dashboard.last_login_method_not_set")}</span>
            )}
          </dd>
        </div>
      </dl>
    </DashboardCard>
  );
}
