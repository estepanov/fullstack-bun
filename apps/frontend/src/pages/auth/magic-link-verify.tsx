import { authClient } from "@/lib/auth-client";
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

        setTimeout(() => {
          navigate("/dashboard", { replace: true });
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
    <div className="flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {status === "verifying" && (
          <>
            <div className="text-6xl">⏳</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t("magic_link_verify.verifying_title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t("magic_link_verify.verifying_message")}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-6xl">✅</div>
            <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {t("magic_link_verify.success_title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t("magic_link_verify.success_message")}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-6xl">❌</div>
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">
              {t("magic_link_verify.error_title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{errorMessage}</p>
            <button
              type="button"
              onClick={() => navigate("/auth/login")}
              className="mt-4 rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              {t("magic_link_verify.go_to_login")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
