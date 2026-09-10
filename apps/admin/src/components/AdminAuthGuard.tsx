import { useSession } from "@admin/lib/auth-client";
import { getFrontendLoginUrl } from "@admin/lib/public-urls";
import { isAdminSession } from "frontend-common/auth";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const AdminAuthGuard = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending } = useSession();
  const { t } = useTranslation("admin");
  const loginUrl = getFrontendLoginUrl();

  useEffect(() => {
    if (!isPending && !session && loginUrl && typeof window !== "undefined") {
      window.location.href = loginUrl;
    }
  }, [isPending, session, loginUrl]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">{t("loading", "Loading...")}</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">
            {loginUrl ? t("redirecting") : t("login_url_missing")}
          </div>
        </div>
      </div>
    );
  }

  if (!isAdminSession(session)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            {t("access_denied", "Access Denied")}
          </h1>
          <p className="text-muted-foreground">
            {t("admin_only", "This area is restricted to administrators only.")}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
