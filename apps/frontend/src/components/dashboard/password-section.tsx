import { GET_USER_PROFILE_QUERY_KEY } from "@frontend/hooks/api/query-key";
import { apiClient } from "@frontend/lib/api-client";
import { authClient } from "@frontend/lib/auth-client";
import { createPasswordSchema } from "@frontend/lib/dashboard/schemas";
import { parseErrorMessage } from "@frontend/lib/dashboard/utils";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
} from "frontend-common/components/ui";
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: simple reset
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
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("dashboard.password_label")}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-foreground">
              {hasPassword ? (
                "••••••••"
              ) : (
                <span className="italic"> {t("dashboard.password_not_set")}</span>
              )}
            </span>
            <Button
              type="button"
              onClick={() => {
                setEditingPassword((value) => !value);
                setSubmitError("");
                setSubmitSuccess("");
              }}
              variant="outline"
              size="xs"
              aria-expanded={editingPassword}
              aria-controls={panelId}
            >
              {editingPassword
                ? t("dashboard.cancel_button")
                : t("dashboard.edit_button")}
            </Button>
          </div>
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
                  <Field>
                    <FieldLabel htmlFor={currentPasswordId}>
                      {t("dashboard.password_current_label")}
                    </FieldLabel>
                    <Input
                      id={currentPasswordId}
                      name="current-password"
                      type="password"
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={t("dashboard.password_current_placeholder")}
                      disabled={form.state.isSubmitting}
                      required
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby={
                        field.state.meta.errors.length > 0 ? errorId : undefined
                      }
                    />
                    {field.state.meta.errors.length > 0 && (
                      <FieldError id={errorId}>
                        {field.state.meta.errors[0]?.message}
                      </FieldError>
                    )}
                    {email && (
                      <FieldDescription>
                        {sentPasswordResetEmail ? (
                          <Trans
                            i18nKey="dashboard.password_current_forgot_email_sent"
                            ns="auth"
                            values={{ email }}
                            components={{
                              address: <span className="font-semibold" />,
                            }}
                          />
                        ) : (
                          <Trans
                            i18nKey="dashboard.password_current_forgot"
                            ns="auth"
                            components={{
                              forgotLink: (
                                <Button
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
                                  variant="link"
                                  className="font-semibold p-0"
                                />
                              ),
                            }}
                          />
                        )}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            )}

            <form.Field
              name="newPassword"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={newPasswordId}>
                    {t("dashboard.password_new_label")}
                  </FieldLabel>
                  <Input
                    id={newPasswordId}
                    name="new-password"
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("dashboard.password_new_placeholder")}
                    disabled={form.state.isSubmitting}
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby={
                      field.state.meta.errors.length > 0 ? errorId : undefined
                    }
                  />
                  <FieldDescription>
                    {t("dashboard.password_hint", { minLength: passwordMinLength })}
                  </FieldDescription>
                  {field.state.meta.errors.length > 0 && (
                    <FieldError id={errorId}>
                      {field.state.meta.errors[0]?.message}
                    </FieldError>
                  )}
                </Field>
              )}
            />
            <form.Field
              name="confirmPassword"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={confirmPasswordId}>
                    {t("dashboard.password_confirm_label")}
                  </FieldLabel>
                  <Input
                    id={confirmPasswordId}
                    name="confirm-new-password"
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("dashboard.password_confirm_placeholder")}
                    disabled={form.state.isSubmitting}
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby={
                      field.state.meta.errors.length > 0 ? errorId : undefined
                    }
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError id={errorId}>
                      {field.state.meta.errors[0]?.message}
                    </FieldError>
                  )}
                </Field>
              )}
            />

            {hasPassword && (
              <form.Field
                name="revokeOtherSessions"
                children={(field) => (
                  <Field orientation="horizontal">
                    <Input
                      id="revoke-other-sessions"
                      name="revoke-other-sessions"
                      type="checkbox"
                      checked={field.state.value ?? false}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      disabled={form.state.isSubmitting}
                    />
                    <FieldLabel htmlFor="revoke-other-sessions" className="font-normal">
                      {t("dashboard.password_revoke_other_sessions_label")}
                    </FieldLabel>
                  </Field>
                )}
              />
            )}
            {submitError && (
              <Alert id={errorId} variant="destructive" className="text-xs">
                {submitError}
              </Alert>
            )}
            {submitSuccess && (
              <Alert id={successId} aria-live="polite" variant="success">
                {submitSuccess}
              </Alert>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={form.state.isSubmitting} size="xs">
                {form.state.isSubmitting
                  ? t("dashboard.password_saving_button")
                  : t("dashboard.password_save_button")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEditingPassword(false);
                  setSubmitError("");
                  setSubmitSuccess("");
                }}
                disabled={form.state.isSubmitting}
                variant="ghost"
                size="xs"
              >
                {t("dashboard.cancel_button")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardCard>
  );
}
