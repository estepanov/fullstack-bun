import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { parseErrorMessage, formatDateTime } from "@/lib/dashboard/utils";
import { Button } from "../ui";
import { DashboardCard } from "./dashboard-card";
import type { SessionRecord } from "@/types/dashboard";

export function SessionsSection() {
  const { t } = useTranslation("auth");
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState(false);

  const currentSessionId = session?.session?.id;

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (a.id === currentSessionId) return -1;
      if (b.id === currentSessionId) return 1;
      const aExpires = new Date(a.expiresAt).getTime();
      const bExpires = new Date(b.expiresAt).getTime();
      return bExpires - aExpires;
    });
  }, [currentSessionId, sessions]);

  const loadSessions = async () => {
    setLoading(true);
    setError("");
    const response = await authClient.listSessions();
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.sessions_load_error")));
      setSessions([]);
    } else {
      setSessions((response.data as SessionRecord[]) ?? []);
    }
    setLoading(false);
  };

  const handleRevokeOtherSessions = async () => {
    setRevoking(true);
    setError("");
    const response = await authClient.revokeOtherSessions();
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.sessions_revoke_error")));
    } else {
      await loadSessions();
    }
    setRevoking(false);
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  return (
    <DashboardCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("dashboard.sessions_title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("dashboard.sessions_description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Button
            type="button"
            onClick={loadSessions}
            variant="outline"
            size="xs"
            disabled={loading}
          >
            {loading
              ? t("dashboard.sessions_refreshing_button")
              : t("dashboard.sessions_refresh_button")}
          </Button>
          <Button
            type="button"
            onClick={handleRevokeOtherSessions}
            variant="destructive"
            size="xs"
            disabled={revoking}
          >
            {revoking
              ? t("dashboard.sessions_revoking_button")
              : t("dashboard.sessions_revoke_other_button")}
          </Button>
        </div>
      </div>
      {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}
      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("dashboard.sessions_loading")}</p>
        ) : sortedSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboard.sessions_empty")}</p>
        ) : (
          sortedSessions.map((sessionItem) => {
            const isCurrent = sessionItem.id === currentSessionId;
            return (
              <div
                key={sessionItem.id}
                className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm relative"
              >
                {isCurrent && (
                  <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {t("dashboard.sessions_current_badge")}
                  </span>
                )}
                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.sessions_expires_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDateTime(sessionItem.expiresAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.sessions_created_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDateTime(sessionItem.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.sessions_ip_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {sessionItem.ipAddress || "-"}
                    </p>
                  </div>
                  <div className="sm:col-span-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.sessions_user_agent_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground wrap-break-words">
                      {sessionItem.userAgent || "-"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardCard>
  );
}
