import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";

export default function VerifyEmailNoticePage() {
  const location = useLocation();
  const email = location.state?.email || "your email";
  const { t } = useTranslation("auth");

  return (
    <div className="flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="text-6xl">📧</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("verify_email_notice.title")}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("verify_email_notice.message")} <strong className="text-gray-900 dark:text-gray-100">{email}</strong>.
        </p>
        <p className="text-gray-600 dark:text-gray-400">{t("verify_email_notice.instruction")}</p>

        <div className="mt-8 rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">{t("verify_email_notice.no_email")}</p>
        </div>

        <Link
          to="/auth/login"
          className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
        >
          {t("verify_email_notice.back_to_login")}
        </Link>
      </div>
    </div>
  );
}
