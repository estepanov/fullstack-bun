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
    <div className="app-surface flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("dashboard.title")}
            </h1>
            <p className="mt-2 text-muted-foreground">{t("dashboard.welcome")}</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
            <h2 className="text-xl font-semibold">{t("dashboard.user_info_title")}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("dashboard.name_label")}
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {session.user.name || t("dashboard.not_provided")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("dashboard.email_label")}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{session.user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("dashboard.email_verified_label")}
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {session.user.emailVerified ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {t("dashboard.verified_badge")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {t("dashboard.not_verified_badge")}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("dashboard.user_id_label")}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{session.user.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("dashboard.role_label")}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{role ?? "-"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
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
          </div>

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
