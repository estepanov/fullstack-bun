import { AppSurfaceCenter } from "@/components/AppSurfaceCenter";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

export default function MagicLinkPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("auth");

  const errorParam = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSent(false);
    setIsLoading(true);

    const origin = window.location.origin;

    await authClient.signIn.magicLink(
      {
        email,
        callbackURL: `${origin}/auth/magic-link/verify`,
        newUserCallbackURL: `${origin}/auth/magic-link/verify`,
        errorCallbackURL: `${origin}/auth/magic-link`,
      },
      {
        onSuccess: () => {
          setSent(true);
          setIsLoading(false);
        },
        onError: (ctx) => {
          setError(ctx.error.message || t("magic_link.error_message"));
          setIsLoading(false);
        },
      },
    );
  };

  return (
    <AppSurfaceCenter>
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5 backdrop-blur">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("magic_link.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("magic_link.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {errorParam && !error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">
                {t("magic_link.error_from_link", { error: errorParam })}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}

          {sent && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {t("magic_link.sent_message", { email })}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {t("magic_link.email_label")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("magic_link.email_placeholder")}
                required
                className="mt-2 block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          >
            {isLoading
              ? t("magic_link.submitting_button")
              : t("magic_link.submit_button")}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {t("magic_link.back_to_login")}{" "}
            <Link
              to="/auth/login"
              className="font-semibold text-primary hover:text-primary/80"
            >
              {t("magic_link.sign_in_link")}
            </Link>
          </p>
        </form>
      </div>
    </AppSurfaceCenter>
  );
}
