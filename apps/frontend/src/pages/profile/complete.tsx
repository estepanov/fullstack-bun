import { AppSurfaceCenter } from "@/components/AppSurfaceCenter";
import { authClient, useSession } from "@/lib/auth-client";
import { getExtendedUser } from "@/types/user";
import {
  Alert,
  Button,
  Input,
  InputDescription,
  Label,
} from "frontend-common/components/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { USERNAME_CONFIG } from "shared/config/user-profile";

export default function CompleteProfilePage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailability, setUsernameAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { data: session, isPending, refetch } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();

  // Determine which fields are missing
  const user = session?.user ? getExtendedUser(session.user) : null;
  const needsName = !user?.name || user.name.trim() === "";
  const needsUsername = !user?.username || user.username.trim() === "";

  // Debounced username availability check
  useEffect(() => {
    if (!username || username.length < USERNAME_CONFIG.minLength) {
      setUsernameAvailability({ checking: false, available: null, message: "" });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameAvailability({ checking: true, available: null, message: "" });

      try {
        const response = await authClient.isUsernameAvailable({
          username,
        });

        if (response.error) {
          let message = "something went wrong";
          if (response.error?.code === "USERNAME_IS_INVALID") {
            message = "Invalid or prohibited username";
          } else {
            console.error("unhandled response.error?.code", response.error);
          }
          setUsernameAvailability({
            checking: false,
            available: false,
            message,
          });
          return;
        }
        setUsernameAvailability({
          checking: false,
          available: response?.data?.available,
          message: response?.data?.available
            ? t("complete_profile.username_available")
            : t("complete_profile.username_taken"),
        });
      } catch {
        setUsernameAvailability({
          checking: false,
          available: null,
          message: "",
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const api = authClient.updateUser;

    try {
      // Build payload with only missing fields
      const payload: { name?: string; username?: string; displayUsername?: string } = {};
      if (needsName && name) payload.name = name;
      if (needsUsername && username) {
        payload.displayUsername = username;
      }

      const response = await api(payload);

      if (response.error) {
        const data = response.error;
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error?: string }).error
            : "Failed to update profile";
        throw new Error(message);
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

  if ((!isPending && !session) || (!needsName && !needsUsername)) {
    return <Navigate to="/" replace />;
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

        <form onSubmit={handleSubmit} className="mt-8 space-y-2">
          {error && <Alert variant="destructive">{error}</Alert>}

          <div className="space-y-2">
            {needsName && (
              <div className="gap-1">
                <Label htmlFor="name">{t("complete_profile.name_label")}</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("complete_profile.name_placeholder")}
                  required
                  className="mt-2 block w-full"
                  disabled={isLoading || isSuccess}
                />
              </div>
            )}

            {needsUsername && (
              <div className="gap-1">
                <Label htmlFor="username">{t("complete_profile.username_label")}</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("complete_profile.username_placeholder")}
                  pattern={USERNAME_CONFIG.pattern.source}
                  minLength={USERNAME_CONFIG.minLength}
                  maxLength={USERNAME_CONFIG.maxLength}
                  required
                  className="mt-2 block w-full"
                  disabled={isLoading || isSuccess}
                />
                {username && (
                  <InputDescription
                    className="mt-1"
                    variant={
                      usernameAvailability.checking
                        ? "default"
                        : usernameAvailability.available === true
                          ? "success"
                          : usernameAvailability.available === false
                            ? "destructive"
                            : "default"
                    }
                  >
                    {usernameAvailability.checking
                      ? t("complete_profile.username_checking")
                      : usernameAvailability.message ||
                        t("complete_profile.username_hint")}
                  </InputDescription>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="default"
            disabled={isLoading || isSuccess}
            className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          >
            {isLoading ? t("complete_profile.submitting") : t("complete_profile.submit")}
          </Button>
        </form>
      </div>
    </AppSurfaceCenter>
  );
}
