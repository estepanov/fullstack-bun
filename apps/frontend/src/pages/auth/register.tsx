import { signUp } from "@/lib/auth-client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Link } from "react-router";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation("auth");

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
    <div className="flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("register.title")}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t("register.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("register.name_label")}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("register.name_placeholder")}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("register.email_label")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("register.email_placeholder")}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("register.password_label")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("register.password_placeholder")}
                required
                minLength={8}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("register.password_hint")}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50"
          >
            {isLoading ? t("register.submitting_button") : t("register.submit_button")}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t("register.have_account")}{" "}
            <Link to="/auth/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              {t("register.sign_in_link")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
