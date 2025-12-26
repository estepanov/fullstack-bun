import { GET_USER_PROFILE_QUERY_KEY } from "@/hooks/api/query-key";
import { apiClient } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { createPasswordSchema } from "@/lib/dashboard/schemas";
import { parseErrorMessage } from "@/lib/dashboard/utils";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { AUTH_CONFIG } from "shared/config/auth";
import { DashboardCard } from "./dashboard-card";

interface PasswordSectionProps {
  hasPassword: boolean;
  email?: string;
}

export function PasswordSection({ hasPassword, email }: PasswordSectionProps) {
  const { t } = useTranslation("auth");
  const queryClient = useQueryClient();
  const passwordMinLength = AUTH_CONFIG.emailPassword.minPasswordLength;
  const currentPasswordId = "dashboard-current-password";
  const newPasswordId = "dashboard-new-password";
  const confirmPasswordId = "dashboard-confirm-password";
  const errorId = "dashboard-password-error";
  const successId = "dashboard-password-success";
  const panelId = "dashboard-password-panel";
  const [sentPasswordResetEmail, setSentPasswordResetEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const resetRedirectTo =
    typeof window === "undefined" ? "" : `${window.location.origin}/auth/reset-password`;

  const passwordSchema = useMemo(() => createPasswordSchema(hasPassword), [hasPassword]);

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: false,
    },
    validators: {
      onChange: passwordSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError("");
      setSubmitSuccess("");

      try {
        if (hasPassword) {
          // User has password - use changePassword
          const response = await authClient.changePassword({
            currentPassword: value.currentPassword ?? "",
            newPassword: value.newPassword,
            revokeOtherSessions: value.revokeOtherSessions ?? false,
          });

          if (response.error) {
            throw new Error(
              parseErrorMessage(response.error, t("dashboard.password_update_error")),
            );
          }
        } else {
          // User doesn't have password - use setPassword endpoint
          const response = await apiClient.user["set-password"].$post({
            json: { newPassword: value.newPassword },
          });

          if (!response.ok) {
            const data = (await response.json()) as { error?: string };
            throw new Error(
              parseErrorMessage(data.error, t("dashboard.password_update_error")),
            );
          }

          await queryClient.invalidateQueries({
            queryKey: [GET_USER_PROFILE_QUERY_KEY],
          });
        }

        setSubmitSuccess(t("dashboard.password_update_success"));
        form.reset();
        setEditingPassword(false);
      } catch (error) {
        setSubmitError(parseErrorMessage(error, t("dashboard.password_update_error")));
      }
    },
  });

  // Reset form when exiting edit mode
  useEffect(() => {
    if (!editingPassword) {
      form.reset();
      setSubmitError("");
      setSubmitSuccess("");
    }
  }, [editingPassword]);

  if (!AUTH_CONFIG.emailPassword.enabled) {
    return null;
  }

  return (
    <DashboardCard>
      <h2 className="text-xl font-semibold">{t("dashboard.security_title")}</h2>
      <div className="mt-4 space-y-3 text-sm text-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("dashboard.password_label")}
            </p>
            <p className="mt-1 text-sm text-foreground">
              {hasPassword ? (
                "••••••••"
              ) : (
                <span className="italic"> {t("dashboard.password_not_set")}</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingPassword((value) => !value);
              setSubmitError("");
              setSubmitSuccess("");
            }}
            className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-expanded={editingPassword}
            aria-controls={panelId}
          >
            {editingPassword ? t("dashboard.cancel_button") : t("dashboard.edit_button")}
          </button>
        </div>
        {editingPassword && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            id={panelId}
            className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4"
          >
            {hasPassword && (
              <form.Field
                name="currentPassword"
                children={(field) => (
                  <div>
                    <label
                      htmlFor={currentPasswordId}
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                    >
                      {t("dashboard.password_current_label")}
                    </label>
                    <input
                      id={currentPasswordId}
                      name="current-password"
                      type="password"
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={t("dashboard.password_current_placeholder")}
                      className="mt-2 block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      disabled={form.state.isSubmitting}
                      required
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby={
                        field.state.meta.errors.length > 0 ? errorId : undefined
                      }
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p
                        id={errorId}
                        role="alert"
                        className="text-xs font-medium text-destructive"
                      >
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                    {email && (
                      <p className="text-xs mt-2 text-muted-foreground">
                        {sentPasswordResetEmail ? (
                          <>
                            <Trans
                              i18nKey="dashboard.password_current_forgot_email_sent"
                              ns="auth"
                              values={{ email }}
                              components={{
                                address: <span className="font-semibold" />,
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <Trans
                              i18nKey="dashboard.password_current_forgot"
                              ns="auth"
                              components={{
                                forgotLink: (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        if (!resetRedirectTo) {
                                          return;
                                        }
                                        await authClient.requestPasswordReset({
                                          email,
                                          redirectTo: resetRedirectTo,
                                        });
                                        setSentPasswordResetEmail(true);
                                      } catch (error) {
                                        console.error(error);
                                      }
                                    }}
                                    className="font-semibold text-primary hover:underline dark:text-primary"
                                  />
                                ),
                              }}
                            />
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}
              />
            )}

            <form.Field
              name="newPassword"
              children={(field) => (
                <div>
                  <label
                    htmlFor={newPasswordId}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    {t("dashboard.password_new_label")}
                  </label>
                  <input
                    id={newPasswordId}
                    name="new-password"
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("dashboard.password_new_placeholder")}
                    className="mt-2 block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={form.state.isSubmitting}
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby={
                      field.state.meta.errors.length > 0 ? errorId : undefined
                    }
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p
                      id={errorId}
                      role="alert"
                      className="text-xs font-medium text-destructive"
                    >
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            />
            <p className="text-xs text-muted-foreground">
              {t("dashboard.password_hint", { minLength: passwordMinLength })}
            </p>
            <form.Field
              name="confirmPassword"
              children={(field) => (
                <div>
                  <label
                    htmlFor={confirmPasswordId}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    {t("dashboard.password_confirm_label")}
                  </label>
                  <input
                    id={confirmPasswordId}
                    name="confirm-new-password"
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("dashboard.password_confirm_placeholder")}
                    className="mt-2 block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={form.state.isSubmitting}
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby={
                      field.state.meta.errors.length > 0 ? errorId : undefined
                    }
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p
                      id={errorId}
                      role="alert"
                      className="text-xs font-medium text-destructive"
                    >
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            />

            {hasPassword && (
              <form.Field
                name="revokeOtherSessions"
                children={(field) => (
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      id="revoke-other-sessions"
                      name="revoke-other-sessions"
                      type="checkbox"
                      checked={field.state.value ?? false}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      disabled={form.state.isSubmitting}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                    <label htmlFor="revoke-other-sessions">
                      {t("dashboard.password_revoke_other_sessions_label")}
                    </label>
                  </div>
                )}
              />
            )}
            {submitError && (
              <p
                id={errorId}
                role="alert"
                className="text-xs font-medium text-destructive"
              >
                {submitError}
              </p>
            )}
            {submitSuccess && (
              <p
                id={successId}
                role="status"
                aria-live="polite"
                className="text-xs font-medium text-emerald-600"
              >
                {submitSuccess}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={form.state.isSubmitting}
                className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
              >
                {form.state.isSubmitting
                  ? t("dashboard.password_saving_button")
                  : t("dashboard.password_save_button")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingPassword(false);
                  setSubmitError("");
                  setSubmitSuccess("");
                }}
                disabled={form.state.isSubmitting}
                className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                {t("dashboard.cancel_button")}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardCard>
  );
}
