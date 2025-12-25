import { AppSurfaceCenter } from "@/components/AppSurfaceCenter";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

export default function CompleteProfilePage() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { isPending, refetch } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const api = apiClient.user.profile.complete.$patch;

    try {
      const response = await api({ json: { name } });

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({ error: "Failed to update profile" }));
        throw new Error(data.error || "Failed to update profile");
      }
      setIsSuccess(true);
      // Refresh session to get updated user data
      await refetch();

      // Redirect to intended destination or dashboard
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      setIsLoading(false);
    }
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

  return (
    <AppSurfaceCenter>
      <div className="w-full flex-1 max-w-md rounded-3xl border border-border/70 bg-card/90 p-8 shadow-sm shadow-black/5 backdrop-blur">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl mb-4">
            ✏️
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("complete_profile.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("complete_profile.subtitle")}
          </p>
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
                htmlFor="name"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {t("complete_profile.name_label")}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("complete_profile.name_placeholder")}
                required
                className="mt-2 block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isLoading || isSuccess}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          >
            {isLoading ? t("complete_profile.submitting") : t("complete_profile.submit")}
          </button>
        </form>
      </div>
    </AppSurfaceCenter>
  );
}
