import { AppSurfaceCenter } from "@/components/AppSurfaceCenter";
import { resetPassword } from "@/lib/auth-client";
import {
  Alert,
  Button,
  Input,
  InputDescription,
  Label,
} from "frontend-common/components/ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useParams } from "react-router";
import { AUTH_CONFIG } from "shared/config/auth";

type ResetStatus = "ready" | "submitting" | "success" | "error";

export default function ResetPasswordPage() {
  const { passwordResetToken } = useParams();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<ResetStatus>("ready");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const passwordsEnabled = AUTH_CONFIG.emailPassword.enabled;
  const passwordMinLength = AUTH_CONFIG.emailPassword.minPasswordLength;

  const errorParam = searchParams.get("error");

  const tokenError = useMemo(() => {
    if (errorParam) {
      return t("reset_password.error_from_link", { error: errorParam });
    }
    if (!passwordResetToken) {
      return t("reset_password.no_token_error");
    }
    return "";
  }, [errorParam, passwordResetToken, t]);

  useEffect(() => {
    if (!passwordsEnabled) {
      navigate("/auth/login", { replace: true });
    }
  }, [navigate, passwordsEnabled]);

  if (!passwordsEnabled) {
    return null;
  }

  if (tokenError) {
    return (
      <AppSurfaceCenter>
        <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/90 p-10 text-center shadow-sm shadow-black/5 backdrop-blur">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-3xl">
            ❌
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-destructive">
            {t("reset_password.error_title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{tokenError}</p>
          <Link
            to="/auth/login"
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {t("reset_password.go_to_login")}
          </Link>
        </div>
      </AppSurfaceCenter>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (!password || password.length < passwordMinLength) {
      setErrorMessage(
        t("reset_password.password_hint", { minLength: passwordMinLength }),
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("reset_password.password_mismatch"));
      return;
    }

    setStatus("submitting");

    try {
      await resetPassword({
        newPassword: password,
        token: passwordResetToken || "",
      });

      setStatus("success");
      setTimeout(() => {
        navigate("/auth/login", { replace: true });
      }, 2500);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : t("reset_password.submit_error"),
      );
    }
  };

  return (
    <AppSurfaceCenter>
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5 backdrop-blur">
        {status === "success" ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl">
              ✅
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
              {t("reset_password.success_title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("reset_password.success_message")}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-semibold tracking-tight">
                {t("reset_password.title")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("reset_password.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

              <div className="space-y-2">
                <div className="gap-1">
                  <Label htmlFor="new-password">
                    {t("reset_password.password_label")}
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("reset_password.password_placeholder")}
                    required
                    minLength={passwordMinLength}
                    className="mt-2 block w-full"
                  />
                  <InputDescription className="mt-2">
                    {t("reset_password.password_hint", { minLength: passwordMinLength })}
                  </InputDescription>
                </div>

                <div className="gap-1">
                  <Label htmlFor="confirm-password">
                    {t("reset_password.confirm_label")}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={t("reset_password.confirm_placeholder")}
                    required
                    minLength={passwordMinLength}
                    className="mt-2 block w-full"
                  />
                </div>
              </div>

              <Button type="submit" disabled={status === "submitting"} className="w-full">
                {status === "submitting"
                  ? t("reset_password.submitting_button")
                  : t("reset_password.submit_button")}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t("reset_password.remembered_password")}{" "}
                <Link
                  to="/auth/login"
                  className="font-semibold text-primary hover:text-primary/80"
                >
                  {t("reset_password.back_to_login")}
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </AppSurfaceCenter>
  );
}
