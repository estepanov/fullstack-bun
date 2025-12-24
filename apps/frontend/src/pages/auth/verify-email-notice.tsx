import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";

export default function VerifyEmailNoticePage() {
  const location = useLocation();
  const email = location.state?.email || "your email";
  const { t } = useTranslation("auth");

  return (
    <div className="app-surface flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/90 p-10 text-center shadow-sm shadow-black/5 backdrop-blur">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
          📧
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          {t("verify_email_notice.title")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("verify_email_notice.message")}{" "}
          <strong className="text-foreground">{email}</strong>.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("verify_email_notice.instruction")}
        </p>

        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <p className="text-sm font-medium text-primary">
            {t("verify_email_notice.no_email")}
          </p>
        </div>

        <Link
          to="/auth/login"
          className="mt-6 inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80"
        >
          {t("verify_email_notice.back_to_login")}
        </Link>
      </div>
    </div>
  );
}
