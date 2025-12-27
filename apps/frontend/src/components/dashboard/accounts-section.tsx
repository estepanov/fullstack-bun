import { authClient } from "@/lib/auth-client";
import {
  formatDateTime,
  formatProviderLabel,
  parseErrorMessage,
} from "@/lib/dashboard/utils";
import type { AccountRecord } from "@/types/dashboard";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AUTH_CONFIG } from "shared/config/auth";
import { Button } from "../ui";
import { DashboardCard } from "./dashboard-card";

export function AccountsSection() {
  if (!AUTH_CONFIG.accountLinking.enabled) {
    return null;
  }
  const { t } = useTranslation("auth");
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const sortedAccounts = useMemo(() => {
    return [...accounts]
      .filter((acc) => acc.providerId !== "credential")
      .sort((a, b) => {
        const aCreated = new Date(a.createdAt).getTime();
        const bCreated = new Date(b.createdAt).getTime();
        return bCreated - aCreated;
      });
  }, [accounts]);

  const loadAccounts = async () => {
    setLoading(true);
    setError("");
    const response = await authClient.listAccounts();
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.accounts_load_error")));
      setAccounts([]);
    } else {
      setAccounts((response.data as AccountRecord[]) ?? []);
    }
    setLoading(false);
  };

  const handleUnlink = async (account: AccountRecord) => {
    setUnlinkingId(account.id);
    setError("");
    const response = await authClient.unlinkAccount({
      providerId: account.providerId,
      accountId: account.accountId,
    });
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.accounts_unlink_error")));
    } else {
      await loadAccounts();
    }
    setUnlinkingId(null);
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  return (
    <DashboardCard>
      <div>
        <h2 className="text-xl font-semibold">{t("dashboard.accounts_title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("dashboard.accounts_description")}
        </p>
      </div>
      {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}
      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.accounts_loading")}
          </p>
        ) : sortedAccounts.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            {t("dashboard.accounts_empty")}
          </p>
        ) : (
          sortedAccounts.map((account) => {
            const isUnlinking = unlinkingId === account.id;
            return (
              <div
                key={account.id}
                className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("dashboard.accounts_provider_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatProviderLabel(account.providerId)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleUnlink(account)}
                    variant="destructive"
                    size="xs"
                    disabled={isUnlinking}
                  >
                    {isUnlinking
                      ? t("dashboard.accounts_unlinking_button")
                      : t("dashboard.accounts_unlink_button")}
                  </Button>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.accounts_account_id_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground wrap-break-words">
                      {account.accountId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.accounts_linked_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDateTime(account.createdAt)}
                    </p>
                  </div>
                  {account.scopes?.length ? (
                    <div className="sm:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                        {t("dashboard.accounts_scopes_label")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {account.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardCard>
  );
}
