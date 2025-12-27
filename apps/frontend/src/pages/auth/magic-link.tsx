import { AppSurfaceCenter } from "@/components/AppSurfaceCenter";
import { AuthOrDivider } from "@/components/auth/AuthOrDivider";
import { LastUsedBadge } from "@/components/auth/LastUsedBadge";
import { SocialAuthButton } from "@/components/auth/SocialAuthButton";
import { authClient } from "@/lib/auth-client";
import { signInWithSocialProvider } from "@/lib/social-auth";
import { Button, Input, Label } from "frontend-common/components/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { LoginMethod } from "shared/auth/login-method";
import { AUTH_CONFIG } from "shared/config/auth";

export default function MagicLinkPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [lastUsedMethod, setLastUsedMethod] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const lastUsedBadge = t("login.last_used_badge");
  const passwordsEnabled = AUTH_CONFIG.emailPassword.enabled;
  const githubEnabled = AUTH_CONFIG.social.github.enabled;
  const passkeyEnabled = AUTH_CONFIG.passkey.enabled;
  const socialEnabled = Object.values(AUTH_CONFIG.social).some(
    (provider) => provider.enabled,
  );
  const showOrDivider = passwordsEnabled || socialEnabled || passkeyEnabled;

  const errorParam = searchParams.get("error");

  useEffect(() => {
    const method = authClient.getLastUsedLoginMethod();
    setLastUsedMethod(method || null);
  }, []);

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

  const handlePasskeyLogin = async () => {
    setError("");
    setPasskeyLoading(true);
    const { error: passkeyError } = await authClient.signIn.passkey({
      autoFill: false,
      fetchOptions: {
        onSuccess: () => {
          navigate("/dashboard");
        },
      },
    });

    if (passkeyError) {
      setError(passkeyError.message || t("magic_link.passkey_error"));
    }
    setPasskeyLoading(false);
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

        <form onSubmit={handleSubmit} className="mt-8 space-y-2">
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t("magic_link.email_label")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("magic_link.email_placeholder")}
              autoComplete="username webauthn"
              required
              className="w-full"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full" variant="default">
            <span className="flex items-center justify-center gap-2">
              {isLoading
                ? t("magic_link.submitting_button")
                : t("magic_link.submit_button")}
              {lastUsedMethod === LoginMethod.MAGIC_LINK && !isLoading && (
                <LastUsedBadge label={lastUsedBadge} />
              )}
            </span>
          </Button>

          {showOrDivider && (
            <AuthOrDivider />
          )}

          {githubEnabled && (
            <SocialAuthButton
              label={t("magic_link.github_button")}
              loadingLabel={t("magic_link.social_submitting")}
              isLoading={activeSocialProvider === "github"}
              isDisabled={activeSocialProvider !== null}
              isLastUsed={lastUsedMethod === "github"}
              lastUsedLabel={lastUsedBadge}
              onClick={handleGitHubLogin}
            />
          )}

          {passkeyEnabled && (
            <Button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading}
              variant={lastUsedMethod === LoginMethod.PASSKEY ? "default" : "outline"}
              className="w-full"
            >
              <span className="flex items-center justify-center gap-2">
                {passkeyLoading
                  ? t("magic_link.passkey_loading")
                  : t("magic_link.passkey_button")}
                {lastUsedMethod === LoginMethod.PASSKEY && !passkeyLoading && (
                  <LastUsedBadge label={lastUsedBadge} />
                )}
              </span>
            </Button>
          )}

          {passwordsEnabled && (
            <Button
              type="button"
              className="w-full"
              variant={lastUsedMethod === LoginMethod.EMAIL ? "default" : "outline"}
              onClick={() => navigate("/auth/login")}
            >
              {t("magic_link.sign_in_link")}
              {lastUsedMethod === LoginMethod.EMAIL && !passkeyLoading && (
                <LastUsedBadge label={lastUsedBadge} />
              )}
            </Button>
          )}
        </form>
      </div>
    </AppSurfaceCenter>
  );
}
