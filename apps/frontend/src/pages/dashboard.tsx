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
              <Button
                type="button"
                onClick={() => signOut()}
                variant="destructive"
              >
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
