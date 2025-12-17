import { useSession } from "@/lib/auth-client";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Protected Route component
 *
 * Wrap any page component that needs authentication with this component.
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();
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

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
