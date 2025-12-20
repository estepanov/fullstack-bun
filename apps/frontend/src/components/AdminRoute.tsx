import { useIsAdmin } from "@/hooks/useIsAdmin";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, isPending, session } = useIsAdmin();
  const { t } = useTranslation("auth");

  if (isPending) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/auth/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
