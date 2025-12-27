import { AppSurfaceCenter } from "@/components/AppSurfaceCenter";
import { authClient } from "@/lib/auth-client";
import { Button } from "frontend-common/components/ui";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

export default function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const hasVerified = useRef(false);
  const navigate = useNavigate();
  const { t } = useTranslation("auth");

  useEffect(() => {
    const token = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setStatus("error");
      setErrorMessage(t("magic_link_verify.error_from_link", { error: errorParam }));
      return;
    }

    if (!token) {
      setStatus("error");
      setErrorMessage(t("magic_link_verify.no_token_error"));
      return;
    }

    if (hasVerified.current) {
      return;
    }

    hasVerified.current = true;

    const verify = async () => {
      try {
        await authClient.magicLink.verify({
          query: {
            token,
          },
        });

        authClient.$store.notify("$sessionSignal");
        setStatus("success");

        // Fetch session to check profile completeness
        const session = await authClient.getSession();

        // Determine redirect URL based on profile completion
        const hasName = session?.data?.user?.name?.trim();

        const redirectUrl = hasName
          ? "/dashboard"
          : "/profile/complete?redirect=/dashboard";

        setTimeout(() => {
          navigate(redirectUrl, { replace: true });
        }, 1500);
      } catch (error) {
        console.error(error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : t("magic_link_verify.error_message"),
        );
      }
    };

    verify();
  }, [searchParams, navigate, t]);

  return (
    <AppSurfaceCenter className="flex-1">
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/90 p-10 text-center shadow-sm shadow-black/5 backdrop-blur">
        {status === "verifying" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
              ⏳
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              {t("magic_link_verify.verifying_title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("magic_link_verify.verifying_message")}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl">
              ✅
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
              {t("magic_link_verify.success_title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("magic_link_verify.success_message")}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-3xl">
              ❌
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-destructive">
              {t("magic_link_verify.error_title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
            <Button
              type="button"
              onClick={() => navigate("/auth/login")}
              className="mt-6"
            >
              {t("magic_link_verify.go_to_login")}
            </Button>
          </>
        )}
      </div>
    </AppSurfaceCenter>
  );
}
