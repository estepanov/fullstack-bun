import { useSession } from "@frontend/lib/auth-client";
import { authClient } from "@frontend/lib/auth-client";
import { formatDateTime, parseErrorMessage } from "@frontend/lib/dashboard/utils";
import type { SessionRecord } from "@frontend/types/dashboard";
import { Alert, Badge, Button } from "frontend-common/components/ui";
import { RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DashboardCard } from "./dashboard-card";

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

  const loadSessions = useCallback(async () => {
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
  }, [t]);

  const handleRevokeOtherSessions = async () => {
    const toastId = toast.loading(t("dashboard.sessions_revoking_button"));
    try {
      setRevoking(true);
      setError("");
      const response = await authClient.revokeOtherSessions();
      if (response.error) {
        setError(parseErrorMessage(response.error, t("dashboard.sessions_revoke_error")));
      } else {
        await loadSessions();
      }
      toast.success(t("dashboard.sessions_revoke_success"), { id: toastId });
    } catch (error) {
      toast.error(t("dashboard.sessions_revoke_error"), { id: toastId });
    } finally {
      setRevoking(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

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
            onClick={handleRevokeOtherSessions}
            variant="destructive"
            size="sm"
            disabled={revoking}
          >
            {revoking
              ? t("dashboard.sessions_revoking_button")
              : t("dashboard.sessions_revoke_other_button")}
          </Button>
          <Button
            type="button"
            onClick={loadSessions}
            variant="ghost"
            size="sm"
            disabled={loading}
            aria-label={
              loading
                ? t("dashboard.sessions_refreshing_button")
                : t("dashboard.sessions_refresh_button")
            }
            className={loading ? "animate-spin" : "animate-none"}
          >
            <RefreshCwIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {error && (
        <Alert variant="destructive" className="mt-4">
          {error}
        </Alert>
      )}
      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.sessions_loading")}
          </p>
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
                  <Badge size="sm" variant="primary" className="absolute right-4 top-4">
                    {t("dashboard.sessions_current_badge")}
                  </Badge>
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
