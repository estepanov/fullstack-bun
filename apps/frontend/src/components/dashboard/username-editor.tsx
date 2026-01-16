import { authClient } from "@frontend/lib/auth-client";
import { usernameSchema } from "@frontend/lib/dashboard/schemas";
import { parseErrorMessage } from "@frontend/lib/dashboard/utils";
import type { UpdateCallback } from "@frontend/types/dashboard";
import { useForm, useStore } from "@tanstack/react-form";
import {
  Alert,
  Button,
  Field,
  FieldDescription,
  FieldError,
  Input,
} from "frontend-common/components/ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { USERNAME_CONFIG } from "shared/config/user-profile";
import { toast } from "sonner";

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

  const isUsernameTakenError = (error: unknown, message: string) => {
    if (!error && !message) return false;
    if (typeof error === "object" && error !== null && "code" in error) {
      const code = (error as { code?: string }).code?.toUpperCase() || "";
      if (
        code.includes("USERNAME") &&
        (code.includes("TAKEN") || code.includes("EXIST"))
      ) {
        return true;
      }
    }
    const normalized = message.toLowerCase();
    return normalized.includes("username") && normalized.includes("taken");
  };

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
        return;
      }

      try {
        const response = await authClient.updateUser({ displayUsername: trimmed });
        if (response.error) {
          const message = parseErrorMessage(
            response.error,
            t("dashboard.username_save_error"),
          );
          setSubmitError(message);
          if (isUsernameTakenError(response.error, message)) {
            setAvailabilityState({
              checking: false,
              available: false,
              message: t("complete_profile.username_taken"),
            });
          } else {
            setAvailabilityState({ checking: false, available: null, message: "" });
          }
          return;
        }
        await onUpdated();
        setEditing(false);
        toast.success(t("dashboard.username_save_success"));
      } catch (error) {
        const message = parseErrorMessage(error, t("dashboard.username_save_error"));
        setSubmitError(message);
        if (isUsernameTakenError(error, message)) {
          setAvailabilityState({
            checking: false,
            available: false,
            message: t("complete_profile.username_taken"),
          });
        } else {
          setAvailabilityState({ checking: false, available: null, message: "" });
        }
      }
    },
  });
  const displayUsernameValue = useStore(
    form.store,
    (state) => state.values.displayUsername,
  );

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

    const currentValue = displayUsernameValue;
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
  }, [displayUsername, editing, displayUsernameValue, t]);

  const usernameStatusMessage = useMemo(() => {
    if (!editing) return "";
    if (!displayUsernameValue) return "";
    if (availabilityState.checking) {
      return t("complete_profile.username_checking");
    }
    return availabilityState.message || t("complete_profile.username_hint");
  }, [editing, t, availabilityState, displayUsernameValue]);

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
              const currentValue = form.state.values.displayUsername.trim();
              const currentUsername = (displayUsername ?? "").trim();
              if (
                currentValue &&
                currentValue !== currentUsername &&
                availabilityState.available === false
              ) {
                setSubmitError(
                  availabilityState.message || t("complete_profile.username_taken"),
                );
                return;
              }
              form.handleSubmit();
            }}
          >
            <div className="space-y-2">
              <form.Field
                name="displayUsername"
                children={(field) => (
                  <Field>
                    <Input
                      id={inputId}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        setSubmitError("");
                        field.handleChange(e.target.value);
                      }}
                      minLength={USERNAME_CONFIG.minLength}
                      maxLength={USERNAME_CONFIG.maxLength}
                      pattern={USERNAME_CONFIG.pattern.source}
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
                      <FieldDescription
                        id={statusId}
                        role={availabilityState.checking ? "status" : undefined}
                        aria-live={availabilityState.checking ? "polite" : undefined}
                      >
                        {usernameStatusMessage}
                      </FieldDescription>
                    )}
                    {field.state.meta.errors.length > 0 && (
                      <FieldError id={errorId}>
                        {field.state.meta.errors[0]?.message}
                      </FieldError>
                    )}
                  </Field>
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
