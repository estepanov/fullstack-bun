import { authClient } from "@/lib/auth-client";
import { passkeySchema } from "@/lib/dashboard/schemas";
import {
  formatDateTime,
  formatProviderLabel,
  parseErrorMessage,
} from "@/lib/dashboard/utils";
import type { PasskeyRecord } from "@/types/dashboard";
import { useForm } from "@tanstack/react-form";
import { RefreshCwIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AUTH_CONFIG } from "shared/config/auth";
import { Alert, Button, Input, Label } from "../ui";
import { DashboardCard } from "./dashboard-card";

export function PasskeysSection() {
  const { t } = useTranslation("auth");
  const [showAddForm, setShowAddForm] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedPasskeys = useMemo(() => {
    return [...passkeys].sort((a, b) => {
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreated - aCreated;
    });
  }, [passkeys]);

  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: passkeySchema,
    },
    onSubmit: async ({ value }) => {
      setError("");
      const trimmedName = value.name.trim();
      const response = await authClient.passkey.addPasskey({
        name: trimmedName || undefined,
      });
      if (response.error) {
        setError(parseErrorMessage(response.error, t("dashboard.passkeys_add_error")));
      } else {
        form.reset();
        await loadPasskeys();
        setShowAddForm(false);
      }
    },
  });

  const loadPasskeys = async () => {
    setLoading(true);
    setError("");
    const response = await authClient.passkey.listUserPasskeys({});
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.passkeys_load_error")));
      setPasskeys([]);
    } else {
      setPasskeys((response.data as PasskeyRecord[]) ?? []);
    }
    setLoading(false);
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    setDeletingId(passkeyId);
    setError("");
    const response = await authClient.passkey.deletePasskey({ id: passkeyId });
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.passkeys_delete_error")));
    } else {
      await loadPasskeys();
    }
    setDeletingId(null);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: only call once on mount
  useEffect(() => {
    void loadPasskeys();
  }, []);

  if (!AUTH_CONFIG.passkey.enabled) {
    return null;
  }

  return (
    <DashboardCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("dashboard.passkeys_title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("dashboard.passkeys_description")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setShowAddForm((curr) => !curr)}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {showAddForm ? "Hide new passkey form" : "Add new passkey"}
          </Button>
          <Button
            type="button"
            onClick={loadPasskeys}
            variant="ghost"
            size="sm"
            disabled={loading}
            aria-label={
              loading
                ? t("dashboard.passkeys_refreshing_button")
                : t("dashboard.passkeys_refresh_button")
            }
            className={loading ? "animate-spin" : "animate-none"}
          >
            <RefreshCwIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showAddForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4 mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          <form.Field
            name="name"
            children={(field) => (
              <Label>
                {t("dashboard.passkeys_name_label")}
                <Input
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="mt-2 w-full"
                  disabled={form.state.isSubmitting}
                  placeholder={t("dashboard.passkeys_name_placeholder")}
                />
              </Label>
            )}
          />
          <div className="flex flex-col justify-end mb-3">
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting
                ? t("dashboard.passkeys_adding_button")
                : t("dashboard.passkeys_add_button")}
            </Button>
          </div>
        </form>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.passkeys_loading")}
          </p>
        ) : sortedPasskeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboard.passkeys_empty")}</p>
        ) : (
          sortedPasskeys.map((passkey) => {
            const isDeleting = deletingId === passkey.id;
            return (
              <div
                key={passkey.id}
                className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("dashboard.passkeys_name_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {passkey.name || t("dashboard.passkeys_name_fallback")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleDeletePasskey(passkey.id)}
                    disabled={isDeleting}
                    variant="destructive"
                    size="xs"
                  >
                    {isDeleting
                      ? t("dashboard.passkeys_deleting_button")
                      : t("dashboard.passkeys_delete_button")}
                  </Button>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.passkeys_device_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatProviderLabel(passkey.deviceType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.passkeys_backed_up_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {passkey.backedUp
                        ? t("dashboard.passkeys_backed_up_yes")
                        : t("dashboard.passkeys_backed_up_no")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.passkeys_created_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDateTime(passkey.createdAt)}
                    </p>
                  </div>
                  {passkey.transports ? (
                    <div className="sm:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                        {t("dashboard.passkeys_transports_label")}
                      </p>
                      <p className="mt-1 text-sm text-foreground wrap-break-words">
                        {passkey.transports}
                      </p>
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
