import { AppSurfaceCenter } from "@/components/AppSurfaceCenter";
import { signUp } from "@/lib/auth-client";
import { Button, Input, Label } from "frontend-common/components/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { AUTH_CONFIG } from "shared/config/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const passwordsEnabled = AUTH_CONFIG.emailPassword.enabled;
  const passwordMinLength = AUTH_CONFIG.emailPassword.minPasswordLength;

  useEffect(() => {
    if (!passwordsEnabled) {
      navigate("/auth/login", { replace: true });
    }
  }, [navigate, passwordsEnabled]);

  if (!passwordsEnabled) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await signUp.email(
      { name, email, password },
      {
        onSuccess: () => {
          // Redirect to verification notice page
          navigate("/auth/verify-email-notice", { state: { email } });
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Registration failed");
          setIsLoading(false);
        },
      },
    );
  };

  return (
    <AppSurfaceCenter>
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5 backdrop-blur">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{t("register.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("register.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}
          <div className="gap-1">
            <Label htmlFor="name">{t("register.name_label")}</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("register.name_placeholder")}
              required
              className="w-full"
            />
          </div>

          <div className="gap-1">
            <Label htmlFor="email">{t("register.email_label")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("register.email_placeholder")}
              required
              className="w-full"
            />
          </div>

          <div className="gap-1">
            <Label htmlFor="password">{t("register.password_label")}</Label>
            <div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("register.password_placeholder")}
                required
                minLength={passwordMinLength}
                className="w-full"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {t("register.password_hint", { minLength: passwordMinLength })}
              </p>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? t("register.submitting_button") : t("register.submit_button")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("register.have_account")}{" "}
            <Link
              to="/auth/login"
              className="font-semibold text-primary hover:text-primary/80"
            >
              {t("register.sign_in_link")}
            </Link>
          </p>
        </form>
      </div>
    </AppSurfaceCenter>
  );
}
