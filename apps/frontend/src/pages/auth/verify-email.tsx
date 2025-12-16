import { verifyEmail } from "@/lib/auth-client";
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
    <div className="flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {status === "verifying" && (
          <>
            <div className="text-6xl">⏳</div>
            <h1 className="text-3xl font-bold">{t("verify_email.verifying_title")}</h1>
            <p className="text-gray-600">{t("verify_email.verifying_message")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-6xl">✅</div>
            <h1 className="text-3xl font-bold text-green-600">
              {t("verify_email.success_title")}
            </h1>
            <p className="text-gray-600">{t("verify_email.success_message")}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-6xl">❌</div>
            <h1 className="text-3xl font-bold text-red-600">
              {t("verify_email.error_title")}
            </h1>
            <p className="text-gray-600">{errorMessage}</p>
            <button
              type="button"
              onClick={() => navigate("/auth/login")}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {t("verify_email.go_to_login")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
