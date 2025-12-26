import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { UserInfoSection } from "@/components/dashboard/user-info-section";
import { PasswordSection } from "@/components/dashboard/password-section";
import { SessionsSection } from "@/components/dashboard/sessions-section";
import { PasskeysSection } from "@/components/dashboard/passkeys-section";
import { AccountsSection } from "@/components/dashboard/accounts-section";
import { useGetUserProfileQuery } from "@/hooks/api/useGetUserProfileQuery";
import { signOut, useSession } from "@/lib/auth-client";
import { getExtendedUser } from "@/types/user";
import { getSessionUserRole } from "frontend-common/auth";
import { useTranslation } from "react-i18next";

function DashboardContent() {
  const { data: session, refetch } = useSession();
  const { data: userProfile } = useGetUserProfileQuery();
  const { t } = useTranslation("auth");

  if (!session) return null;

  const user = getExtendedUser(session.user);
  const role = getSessionUserRole(session);

  const handleProfileRefresh = async () => {
    await refetch();
  };

  return (
    <div className="app-surface flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <DashboardCard>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("dashboard.title")}
            </h1>
            <p className="mt-2 text-muted-foreground">{t("dashboard.welcome")}</p>
          </DashboardCard>

          <UserInfoSection
            user={user}
            role={role}
            onUpdated={handleProfileRefresh}
          />

          <PasswordSection
            email={userProfile?.email}
            hasPassword={!!userProfile?.hasPassword}
          />
          <PasskeysSection />
          <SessionsSection />
          <AccountsSection />

          <DashboardCard>
            <h2 className="text-xl font-semibold">{t("dashboard.actions_title")}</h2>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center rounded-full bg-destructive px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive/40"
              >
                {t("dashboard.sign_out_button")}
              </button>
            </div>
          </DashboardCard>

          <div className="rounded-2xl border border-border/70 bg-primary/10 p-4">
            <p className="text-sm font-medium text-primary">
              {t("dashboard.protected_notice")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
