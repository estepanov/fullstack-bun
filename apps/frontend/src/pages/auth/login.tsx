import { AppSurfaceCenter } from "@/components/AppSurfaceCenter";
import { signIn, useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Link } from "react-router";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");

  useEffect(() => {
    if (!isPending && session) {
      navigate("/dashboard", { replace: true });
    }
  }, [isPending, session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await signIn.email(
      { email, password },
      {
        onSuccess: () => {
          navigate("/dashboard");
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Login failed");
          setIsLoading(false);
        },
      },
    );
  };

  if (isPending) {
    return (
      <div className="app-surface flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-lg">{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <AppSurfaceCenter>
      <div className="w-full flex-1 max-w-md rounded-3xl border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5 backdrop-blur">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{t("login.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {t("login.email_label")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.email_placeholder")}
                required
                className="mt-2 block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {t("login.password_label")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.password_placeholder")}
                required
                className="mt-2 block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          >
            {isLoading ? t("login.submitting_button") : t("login.submit_button")}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Link
            to="/auth/magic-link"
            className="block w-full rounded-full border-2 border-border/70 bg-background/50 px-4 py-2.5 text-center text-sm font-semibold text-foreground shadow-sm hover:bg-background hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
          >
            {t("login.magic_link_link")}
          </Link>

          <div className="pt-4 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">{t("login.no_account")}</p>
            <Link
              to="/auth/register"
              className="mt-2 w-full inline-block rounded-full bg-secondary px-6 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            >
              {t("login.sign_up_link")}
            </Link>
          </div>
        </form>
      </div>
    </AppSurfaceCenter>
  );
}
