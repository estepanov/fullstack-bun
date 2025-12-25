import { useSession } from "@/lib/auth-client";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router";

interface ProtectedRouteProps {
  children: ReactNode;
  requireCompleteProfile?: boolean;
}

/**
 * Protected Route component with optional profile completion check
 *
 * Wrap any page component that needs authentication with this component.
 * By default, also checks if user has completed required profile fields.
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 *
 * // Disable profile completion check
 * <ProtectedRoute requireCompleteProfile={false}>
 *   <SomePage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requireCompleteProfile = true
}: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();
  const { t } = useTranslation("auth");
  const location = useLocation();

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

  // Check profile completion (skip for profile completion page itself)
  if (requireCompleteProfile && location.pathname !== "/profile/complete") {
    const hasName = session.user.name && session.user.name.trim() !== "";

    if (!hasName) {
      // Redirect to profile completion with return URL
      const returnUrl = `${location.pathname}${location.search}`;
      return (
        <Navigate
          to={`/profile/complete?redirect=${encodeURIComponent(returnUrl)}`}
          replace
        />
      );
    }
  }

  return <>{children}</>;
}
