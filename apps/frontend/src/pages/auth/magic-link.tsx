import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

export default function MagicLinkPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("auth");

  const errorParam = searchParams.get("error");

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

  return (
    <div className="flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t("magic_link.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t("magic_link.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {errorParam && !error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-300">
                {t("magic_link.error_from_link", { error: errorParam })}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {sent && (
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 p-4">
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                {t("magic_link.sent_message", { email })}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("magic_link.email_label")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("magic_link.email_placeholder")}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-emerald-600 dark:bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50"
          >
            {isLoading
              ? t("magic_link.submitting_button")
              : t("magic_link.submit_button")}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t("magic_link.back_to_login")} {""}
            <Link
              to="/auth/login"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              {t("magic_link.sign_in_link")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
