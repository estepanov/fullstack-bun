import { ProtectedRoute } from "@/components/ProtectedRoute";
import { signOut, useSession } from "@/lib/auth-client";
import { getSessionUserRole } from "frontend-common/auth";
import { useTranslation } from "react-i18next";

function DashboardContent() {
  const { data: session } = useSession();
  const { t } = useTranslation("auth");

  if (!session) return null;
  const role = getSessionUserRole(session);

  return (
    <div className="bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("dashboard.title")}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t("dashboard.welcome")}</p>
          </div>

          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t("dashboard.user_info_title")}
            </h2>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("dashboard.name_label")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {session.user.name || t("dashboard.not_provided")}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("dashboard.email_label")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{session.user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("dashboard.email_verified_label")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {session.user.emailVerified ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                      {t("dashboard.verified_badge")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                      {t("dashboard.not_verified_badge")}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("dashboard.user_id_label")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{session.user.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t("dashboard.role_label")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{role ?? "-"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t("dashboard.actions_title")}
            </h2>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-md bg-red-600 dark:bg-red-500 px-4 py-2 text-white hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
              >
                {t("dashboard.sign_out_button")}
              </button>
            </div>
          </div>

          <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">{t("dashboard.protected_notice")}</p>
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
