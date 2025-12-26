import { authClient } from "@/lib/auth-client";
import { nameSchema } from "@/lib/dashboard/schemas";
import { parseErrorMessage } from "@/lib/dashboard/utils";
import type { UpdateCallback } from "@/types/dashboard";
import { useForm } from "@tanstack/react-form";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface NameEditorProps {
  name?: string | null;
  onUpdated: UpdateCallback;
}

export function NameEditor({ name, onUpdated }: NameEditorProps) {
  const { t } = useTranslation("auth");
  const inputId = "dashboard-name";
  const errorId = "dashboard-name-error";
  const labelId = "dashboard-name-label";
  const [editing, setEditing] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const form = useForm({
    defaultValues: {
      name: name ?? "",
    },
    validators: {
      onChange: nameSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError("");
      const trimmed = value.name.trim();

      // Check if unchanged
      if (trimmed === (name ?? "")) {
        setEditing(false);
        return;
      }

      try {
        const response = await authClient.updateUser({ name: trimmed });
        if (response.error) {
          throw new Error(
            parseErrorMessage(response.error, t("dashboard.name_save_error")),
          );
        }
        await onUpdated();
        setEditing(false);
      } catch (error) {
        setSubmitError(parseErrorMessage(error, t("dashboard.name_save_error")));
      }
    },
  });

  // Reset form when exiting edit mode
  useEffect(() => {
    if (!editing) {
      form.reset();
      setSubmitError("");
    }
  }, [editing, form]);

  return (
    <div>
      <dt
        id={labelId}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        {t("dashboard.name_label")}
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
                name="name"
                children={(field) => (
                  <>
                    <input
                      id={inputId}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        setSubmitError("");
                        field.handleChange(e.target.value);
                      }}
                      className="block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      disabled={form.state.isSubmitting}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-labelledby={labelId}
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
                  </>
                )}
              />
              {submitError && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {submitError}
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={form.state.isSubmitting}
                  className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                >
                  {t("dashboard.save_button")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setSubmitError("");
                  }}
                  disabled={form.state.isSubmitting}
                  className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                >
                  {t("dashboard.cancel_button")}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <span>{name || t("dashboard.not_provided")}</span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center rounded-full border border-border/70 px-2 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={t("dashboard.edit_button")}
            >
              {t("dashboard.edit_button")}
            </button>
          </div>
        )}
      </dd>
    </div>
  );
}
