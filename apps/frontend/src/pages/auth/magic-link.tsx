import { AppSurfaceCenter } from "@/components/AppSurfaceCenter";
import { SocialAuthButton } from "@/components/auth/SocialAuthButton";
import { authClient } from "@/lib/auth-client";
import { signInWithSocialProvider } from "@/lib/social-auth";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { AUTH_CONFIG } from "shared/config/auth";

export default function MagicLinkPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("auth");
  const passwordsEnabled = AUTH_CONFIG.emailPassword.enabled;
  const githubEnabled = AUTH_CONFIG.social.github.enabled;
  const socialEnabled = Object.values(AUTH_CONFIG.social).some(
    (provider) => provider.enabled,
  );
  const showOrDivider = passwordsEnabled || socialEnabled;

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

  const handleGitHubLogin = async () => {
    setError("");
    setActiveSocialProvider("github");
    try {
      await signInWithSocialProvider("github");
    } catch (socialError) {
      console.error("GitHub login failed:", socialError);
      setError(t("magic_link.social_error"));
    } finally {
      setActiveSocialProvider(null);
    }
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

          {showOrDivider && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
          )}

          {githubEnabled && (
            <SocialAuthButton
              label={t("magic_link.github_button")}
              loadingLabel={t("magic_link.social_submitting")}
              isLoading={activeSocialProvider === "github"}
              isDisabled={activeSocialProvider !== null}
              onClick={handleGitHubLogin}
            />
          )}

          {passwordsEnabled && (
            <Link
              to="/auth/login"
              className="block w-full rounded-full border-2 border-border/70 bg-background/50 px-4 py-2.5 text-center text-sm font-semibold text-foreground shadow-sm hover:bg-background hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            >
              {t("magic_link.sign_in_link")}
            </Link>
          )}
        </form>
      </div>
    </AppSurfaceCenter>
  );
}
