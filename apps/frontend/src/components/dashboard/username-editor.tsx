import { authClient } from "@/lib/auth-client";
import { usernameSchema } from "@/lib/dashboard/schemas";
import { parseErrorMessage } from "@/lib/dashboard/utils";
import type { UpdateCallback } from "@/types/dashboard";
import { useForm } from "@tanstack/react-form";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { USERNAME_CONFIG } from "shared/config/user-profile";
import { Alert, Button, Input, InputError } from "../ui";

interface UsernameEditorProps {
  displayUsername?: string | null;
  onUpdated: UpdateCallback;
}

export function UsernameEditor({ displayUsername, onUpdated }: UsernameEditorProps) {
  const { t } = useTranslation("auth");
  const inputId = "dashboard-username";
  const statusId = "dashboard-username-status";
  const errorId = "dashboard-username-error";
  const labelId = "dashboard-username-label";
  const [editing, setEditing] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [availabilityState, setAvailabilityState] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });

  const form = useForm({
    defaultValues: {
      displayUsername: displayUsername ?? "",
    },
    validators: {
      onChange: usernameSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError("");
      const trimmed = value.displayUsername.trim();

      // Check if unchanged
      if (trimmed === (displayUsername ?? "")) {
        setEditing(false);
        return;
      }

      // Check if availability check failed
      if (availabilityState.available === false) {
        setSubmitError(availabilityState.message || t("complete_profile.username_taken"));
        setAvailabilityState({ checking: false, available: null, message: "" });
        return;
      }

      try {
        const response = await authClient.updateUser({ displayUsername: trimmed });
        if (response.error) {
          throw new Error(
            parseErrorMessage(response.error, t("dashboard.username_save_error")),
          );
        }
        await onUpdated();
        setEditing(false);
      } catch (error) {
        setSubmitError(parseErrorMessage(error, t("dashboard.username_save_error")));
        setAvailabilityState({ checking: false, available: null, message: "" });
      }
    },
  });

  // Reset form when exiting edit mode
  // biome-ignore lint/correctness/useExhaustiveDependencies: consistent refs only care about edit
  useEffect(() => {
    if (!editing) {
      form.reset();
      setSubmitError("");
      setAvailabilityState({ checking: false, available: null, message: "" });
    }
  }, [editing]);

  // Username availability checking with debounce
  useEffect(() => {
    if (!editing) return;

    const currentValue = form.state.values.displayUsername;
    const normalized = currentValue.trim();
    const current = (displayUsername ?? "").trim();

    if (!normalized || normalized.length < USERNAME_CONFIG.minLength) {
      setAvailabilityState({ checking: false, available: null, message: "" });
      return;
    }

    if (normalized === current) {
      setAvailabilityState({ checking: false, available: true, message: "" });
      return;
    }

    const timer = setTimeout(async () => {
      setAvailabilityState({ checking: true, available: null, message: "" });
      try {
        const response = await authClient.isUsernameAvailable({
          username: normalized,
        });

        if (response.error) {
          let message = t("complete_profile.username_invalid");
          if (response.error?.code !== "USERNAME_IS_INVALID") {
            message = t("dashboard.username_check_failed");
          }
          setAvailabilityState({
            checking: false,
            available: false,
            message,
          });
          return;
        }

        setAvailabilityState({
          checking: false,
          available: response?.data?.available,
          message: response?.data?.available
            ? t("complete_profile.username_available")
            : t("complete_profile.username_taken"),
        });
      } catch {
        setAvailabilityState({
          checking: false,
          available: null,
          message: t("dashboard.username_check_failed"),
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [displayUsername, editing, form.state.values.displayUsername, t]);

  const usernameStatusMessage = useMemo(() => {
    if (!editing) return "";
    if (!form.state.values.displayUsername) return "";
    if (availabilityState.checking) {
      return t("complete_profile.username_checking");
    }
    return availabilityState.message || t("complete_profile.username_hint");
  }, [editing, t, availabilityState, form.state.values.displayUsername]);

  return (
    <div>
      <dt
        id={labelId}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        {t("dashboard.user_username_label")}
      </dt>
      <dd className="mt-1 text-sm text-foreground">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="space-y-2">
              <form.Field
                name="displayUsername"
                children={(field) => (
                  <>
                    <Input
                      id={inputId}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      minLength={USERNAME_CONFIG.minLength}
                      maxLength={USERNAME_CONFIG.maxLength}
                      pattern={USERNAME_CONFIG.pattern.source}
                      className="block w-full"
                      disabled={form.state.isSubmitting}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-labelledby={labelId}
                      aria-describedby={
                        [
                          usernameStatusMessage ? statusId : "",
                          field.state.meta.errors.length > 0 ? errorId : "",
                        ]
                          .filter(Boolean)
                          .join(" ") || undefined
                      }
                    />
                    {usernameStatusMessage && (
                      <p
                        id={statusId}
                        role={availabilityState.checking ? "status" : undefined}
                        aria-live={availabilityState.checking ? "polite" : undefined}
                        className={`text-xs ${
                          availabilityState.checking
                            ? "text-muted-foreground"
                            : availabilityState.available === true
                              ? "text-emerald-600"
                              : availabilityState.available === false
                                ? "text-destructive"
                                : "text-muted-foreground"
                        }`}
                      >
                        {usernameStatusMessage}
                      </p>
                    )}
                    {field.state.meta.errors.length > 0 && (
                      <InputError id={errorId} className="text-xs">
                        {field.state.meta.errors[0]?.message}
                      </InputError>
                    )}
                  </>
                )}
              />
              {submitError && (
                <Alert variant="destructive" className="text-xs">
                  {submitError}
                </Alert>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={form.state.isSubmitting}
                  variant="default"
                  size="xs"
                >
                  {t("dashboard.save_button")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setSubmitError("");
                  }}
                  variant="ghost"
                  size="xs"
                  disabled={form.state.isSubmitting}
                  // className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                >
                  {t("dashboard.cancel_button")}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <span>{displayUsername || t("dashboard.not_provided")}</span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setEditing(true)}
              aria-label={t("dashboard.edit_button")}
            >
              {t("dashboard.edit_button")}
            </Button>
          </div>
        )}
      </dd>
    </div>
  );
}
