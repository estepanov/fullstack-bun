import { ProtectedRoute } from "@/components/ProtectedRoute";
import { signOut, useSession } from "@/lib/auth-client";
import { useTranslation } from "react-i18next";

function DashboardContent() {
  const { data: session } = useSession();
  const { t } = useTranslation("auth");

  if (!session) return null;

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h1 className="text-3xl font-bold text-gray-900">{t("dashboard.title")}</h1>
            <p className="mt-2 text-gray-600">{t("dashboard.welcome")}</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("dashboard.user_info_title")}
            </h2>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {t("dashboard.name_label")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {session.user.name || t("dashboard.not_provided")}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {t("dashboard.email_label")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{session.user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {t("dashboard.email_verified_label")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {session.user.emailVerified ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      {t("dashboard.verified_badge")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      {t("dashboard.not_verified_badge")}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {t("dashboard.user_id_label")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{session.user.id}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("dashboard.actions_title")}
            </h2>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                {t("dashboard.sign_out_button")}
              </button>
            </div>
          </div>

          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">{t("dashboard.protected_notice")}</p>
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
