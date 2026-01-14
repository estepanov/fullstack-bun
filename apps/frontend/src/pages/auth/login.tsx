import { AppSurfaceCenter } from "@frontend/components/AppSurfaceCenter";
import { AuthOrDivider } from "@frontend/components/auth/AuthOrDivider";
import { LastUsedBadge } from "@frontend/components/auth/LastUsedBadge";
import { SocialAuthButton } from "@frontend/components/auth/SocialAuthButton";
import { authClient, signIn, useSession } from "@frontend/lib/auth-client";
import { signInWithSocialProvider } from "@frontend/lib/social-auth";
import {
  Alert,
  Button,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  StyledLink,
} from "frontend-common/components/ui";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { LoginMethod } from "shared/auth/login-method";
import { AUTH_CONFIG } from "shared/config/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [resetMessage, setResetMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<string | null>(null);
  const [lastUsedMethod, setLastUsedMethod] = useState<string | null>(null);
  const autoPasskeyAttempted = useRef(false);
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const lastUsedBadge = t("login.last_used_badge");
  const passwordsEnabled = AUTH_CONFIG.emailPassword.enabled;
  const magicLinkEnabled = AUTH_CONFIG.magicLink.enabled;
  const passkeyEnabled = AUTH_CONFIG.passkey.enabled;
  const githubEnabled = AUTH_CONFIG.social.github.enabled;
  const socialEnabled = Object.values(AUTH_CONFIG.social).some(
    (provider) => provider.enabled,
  );
  const showAltDivider =
    passwordsEnabled && (magicLinkEnabled || socialEnabled || passkeyEnabled);

  useEffect(() => {
    if (!isPending && session) {
      navigate("/dashboard", { replace: true });
    }
  }, [isPending, session, navigate]);

  useEffect(() => {
    if (isPending || session) return;
    if (!passwordsEnabled && magicLinkEnabled && !socialEnabled && !passkeyEnabled) {
      navigate("/auth/magic-link", { replace: true });
    }
  }, [
    isPending,
    magicLinkEnabled,
    navigate,
    passwordsEnabled,
    passkeyEnabled,
    session,
    socialEnabled,
  ]);

  useEffect(() => {
    const method = authClient.getLastUsedLoginMethod();
    setLastUsedMethod(method || null);
  }, []);

  useEffect(() => {
    if (!passkeyEnabled || isPending || session) return;
    if (typeof window === "undefined" || !("PublicKeyCredential" in window)) return;

    const preloadPasskeys = async () => {
      if (!PublicKeyCredential.isConditionalMediationAvailable) return;
      const canAutoFill = await PublicKeyCredential.isConditionalMediationAvailable();
      if (!canAutoFill) return;
      if (autoPasskeyAttempted.current) return;
      autoPasskeyAttempted.current = true;
      await authClient.signIn.passkey({
        autoFill: true,
        fetchOptions: {
          onSuccess: () => {
            navigate("/dashboard");
          },
        },
      });
    };

    void preloadPasskeys();
  }, [isPending, navigate, passkeyEnabled, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await signIn.email(
      { email, password },
      {
        onSuccess: () => {
          navigate("/dashboard");
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Login failed");
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
      setError(t("login.social_error"));
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
      setError(passkeyError.message || t("login.passkey_error"));
    }
    setPasskeyLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setResetStatus("idle");
      setResetMessage(t("login.reset_link_missing_email"));
      return;
    }

    setResetStatus("sending");
    setResetMessage("");

    try {
      if (typeof window === "undefined") {
        throw new Error("Window not available");
      }
      const { error: resetError } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        throw new Error(resetError.message || t("login.reset_link_error"));
      }

      setResetStatus("sent");
      setResetMessage(t("login.reset_link_sent", { email }));
    } catch (resetError) {
      console.error(resetError);
      setResetStatus("idle");
      setResetMessage(t("login.reset_link_error"));
    }
  };

  if (isPending) {
    return (
      <div className="app-surface flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-lg">{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <AppSurfaceCenter>
      <div className="w-full flex-1 max-w-md rounded-3xl border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5 backdrop-blur">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t("login.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}

          {passwordsEnabled ? (
            <>
              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="email">{t("login.email_label")}</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("login.email_placeholder")}
                    autoComplete="username webauthn"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">{t("login.password_label")}</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("login.password_placeholder")}
                    autoComplete="current-password webauthn"
                    required
                  />
                  <FieldDescription className="flex items-center gap-1">
                    <span>{t("login.forgot_password")}</span>
                    <Button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={resetStatus === "sending"}
                      variant="link"
                      className="p-0"
                    >
                      {resetStatus === "sending"
                        ? t("login.reset_link_sending")
                        : t("login.reset_link")}
                    </Button>
                  </FieldDescription>
                  {resetMessage && (
                    <Alert variant={resetStatus === "sent" ? "success" : "destructive"}>
                      {resetMessage}
                    </Alert>
                  )}
                </Field>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                variant="default"
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? t("login.submitting_button") : t("login.submit_button")}
                  {lastUsedMethod === "email" && !isLoading && (
                    <LastUsedBadge label={lastUsedBadge} />
                  )}
                </span>
              </Button>

              {showAltDivider && <AuthOrDivider />}
            </>
          ) : null}

          {passkeyEnabled && (
            <Button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading || isLoading}
              className="w-full"
              variant={lastUsedMethod === LoginMethod.PASSKEY ? "default" : "outline"}
            >
              <span className="flex items-center justify-center gap-2">
                {passkeyLoading ? t("login.passkey_loading") : t("login.passkey_button")}
                {lastUsedMethod === LoginMethod.PASSKEY && (
                  <LastUsedBadge label={lastUsedBadge} />
                )}
              </span>
            </Button>
          )}

          {magicLinkEnabled && (
            <Button
              type="button"
              onClick={() => navigate("/auth/magic-link")}
              className="w-full"
              variant={lastUsedMethod === LoginMethod.MAGIC_LINK ? "default" : "outline"}
            >
              <span className="flex items-center justify-center gap-2">
                {t("login.magic_link_link")}
                {lastUsedMethod === LoginMethod.MAGIC_LINK && (
                  <LastUsedBadge label={lastUsedBadge} />
                )}
              </span>
            </Button>
          )}

          {githubEnabled && (
            <SocialAuthButton
              label={t("login.github_button")}
              loadingLabel={t("login.social_submitting")}
              isLoading={activeSocialProvider === "github"}
              isDisabled={activeSocialProvider !== null}
              isLastUsed={lastUsedMethod === "github"}
              lastUsedLabel={lastUsedBadge}
              onClick={handleGitHubLogin}
            />
          )}

          {passwordsEnabled && (
            <div className="mt-6 pt-6 border-t border-border/50 text-center flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">{t("login.no_account")}</p>
              <StyledLink className="w-full" variant="secondary" to="/auth/register">
                {t("login.sign_up_link")}
              </StyledLink>
            </div>
          )}
        </form>
      </div>
    </AppSurfaceCenter>
  );
}
