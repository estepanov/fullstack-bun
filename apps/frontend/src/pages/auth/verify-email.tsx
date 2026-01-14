import { AppSurfaceCenter } from "@frontend/components/AppSurfaceCenter";
import { verifyEmail } from "@frontend/lib/auth-client";
import { Button } from "frontend-common/components/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation("auth");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage(t("verify_email.no_token_error"));
      return;
    }

    // Verify email with token
    const verify = async () => {
      try {
        await verifyEmail({
          query: {
            token,
          },
        });

        setStatus("success");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/auth/login");
        }, 3000);
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Email verification failed",
        );
      }
    };

    verify();
  }, [searchParams, navigate, t]);

  return (
    <AppSurfaceCenter>
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/90 p-8 text-center shadow-sm shadow-black/5 backdrop-blur">
        {status === "verifying" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
              ⏳
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("verify_email.verifying_title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("verify_email.verifying_message")}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl">
              ✅
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
              {t("verify_email.success_title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("verify_email.success_message")}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-3xl">
              ❌
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-destructive">
              {t("verify_email.error_title")}
            </h1>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button type="button" onClick={() => navigate("/auth/login")}>
              {t("verify_email.go_to_login")}
            </Button>
          </div>
        )}
      </div>
    </AppSurfaceCenter>
  );
}
