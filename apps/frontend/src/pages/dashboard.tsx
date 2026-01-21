import { ProtectedRoute } from "@frontend/components/ProtectedRoute";
import { AccountsSection } from "@frontend/components/dashboard/accounts-section";
import { DashboardCard } from "@frontend/components/dashboard/dashboard-card";
import { PasskeysSection } from "@frontend/components/dashboard/passkeys-section";
import { PasswordSection } from "@frontend/components/dashboard/password-section";
import { SessionsSection } from "@frontend/components/dashboard/sessions-section";
import { UserInfoSection } from "@frontend/components/dashboard/user-info-section";
import { NotificationPreferences } from "@frontend/components/notifications/NotificationPreferences";
import { useGetUserProfileQuery } from "@frontend/hooks/api/useGetUserProfileQuery";
import { signOut, useSession } from "@frontend/lib/auth-client";
import { getExtendedUser } from "@frontend/types/user";
import { getSessionUserRole } from "frontend-common/auth";
import { Alert, AlertDescription, Button } from "frontend-common/components/ui";
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

          <UserInfoSection user={user} role={role} onUpdated={handleProfileRefresh} />

          <PasswordSection
            email={userProfile?.email}
            hasPassword={!!userProfile?.hasPassword}
          />
          <PasskeysSection />
          <SessionsSection />
          <AccountsSection />

          <NotificationPreferences />

          <DashboardCard>
            <h2 className="text-xl font-semibold">{t("dashboard.actions_title")}</h2>
            <div className="mt-4">
              <Button type="button" onClick={() => signOut()} variant="destructive">
                {t("dashboard.sign_out_button")}
              </Button>
            </div>
          </DashboardCard>

          <Alert variant="info" size="sm">
            <AlertDescription>{t("dashboard.protected_notice")}</AlertDescription>
          </Alert>
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
