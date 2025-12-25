import { ProtectedRoute } from "@/components/ProtectedRoute";
import { authClient, signOut, useSession } from "@/lib/auth-client";
import { getExtendedUser } from "@/types/user";
import { getSessionUserRole } from "frontend-common/auth";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AUTH_CONFIG } from "shared/config/auth";
import { USERNAME_CONFIG } from "shared/config/user-profile";

type UpdateCallback = () => Promise<void>;

const parseErrorMessage = (error: unknown, fallback: string) => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: string }).message;
    if (typeof message === "string" && message.trim() !== "") return message;
  }
  if (typeof error === "object" && error !== null && "error" in error) {
    const message = (error as { error?: unknown }).error;
    if (typeof message === "string" && message.trim() !== "") return message;
  }
  return fallback;
};

function NameEditor({
  name,
  onUpdated,
}: { name?: string | null; onUpdated: UpdateCallback }) {
  const { t } = useTranslation("auth");
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    if (!editing) {
      setNameValue(name ?? "");
      setNameError("");
    }
  }, [editing, name]);

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    setNameError("");
    if (!trimmed) {
      setNameError(t("dashboard.name_required"));
      return;
    }
    if (trimmed === (name ?? "")) {
      setEditing(false);
      return;
    }
    setNameSaving(true);
    try {
      const response = await authClient.updateUser({ name: trimmed });
      if (response.error) {
        throw new Error(
          parseErrorMessage(response.error, t("dashboard.name_save_error")),
        );
      }
      await onUpdated();
      setEditing(false);
    } catch (error) {
      setNameError(parseErrorMessage(error, t("dashboard.name_save_error")));
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {t("dashboard.name_label")}
      </dt>
      <dd className="mt-1 text-sm text-foreground">
        {editing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={nameValue}
              onChange={(event) => {
                setNameValue(event.target.value);
                if (nameError) {
                  setNameError("");
                }
              }}
              className="block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={nameSaving}
            />
            {nameError && (
              <p className="text-xs font-medium text-destructive">{nameError}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveName}
                disabled={nameSaving}
                className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
              >
                {t("dashboard.save_button")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setNameError("");
                }}
                disabled={nameSaving}
                className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                {t("dashboard.cancel_button")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>{name || t("dashboard.not_provided")}</span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center rounded-full border border-border/70 px-2 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={t("dashboard.edit_button")}
            >
              {t("dashboard.edit_button")}
            </button>
          </div>
        )}
      </dd>
    </div>
  );
}

function UsernameEditor({
  displayUsername,
  onUpdated,
}: {
  displayUsername?: string | null;
  onUpdated: UpdateCallback;
}) {
  const { t } = useTranslation("auth");
  const [editing, setEditing] = useState(false);
  const [usernameValue, setUsernameValue] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });

  useEffect(() => {
    if (!editing) {
      setUsernameValue(displayUsername ?? "");
      setUsernameAvailability({ checking: false, available: null, message: "" });
      setUsernameError("");
    }
  }, [displayUsername, editing]);

  useEffect(() => {
    if (!editing) return;
    const normalized = usernameValue.trim();
    const current = (displayUsername ?? "").trim();

    if (!normalized || normalized.length < USERNAME_CONFIG.minLength) {
      setUsernameAvailability({ checking: false, available: null, message: "" });
      return;
    }

    if (normalized === current) {
      setUsernameAvailability({ checking: false, available: true, message: "" });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameAvailability({ checking: true, available: null, message: "" });
      try {
        const response = await authClient.isUsernameAvailable({
          username: normalized,
        });

        if (response.error) {
          let message = t("complete_profile.username_invalid");
          if (response.error?.code !== "USERNAME_IS_INVALID") {
            message = t("dashboard.username_check_failed");
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
          message: t("dashboard.username_check_failed"),
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [displayUsername, editing, t, usernameValue]);

  const usernameStatusMessage = useMemo(() => {
    if (!editing) return "";
    if (!usernameValue) return "";
    if (usernameError) return "";
    if (usernameAvailability.checking) {
      return t("complete_profile.username_checking");
    }
    return usernameAvailability.message || t("complete_profile.username_hint");
  }, [editing, t, usernameAvailability, usernameError, usernameValue]);

  const handleSaveUsername = async () => {
    const trimmed = usernameValue.trim();
    setUsernameError("");
    if (!trimmed) {
      setUsernameError(t("dashboard.username_required"));
      return;
    }
    if (!USERNAME_CONFIG.pattern.test(trimmed)) {
      setUsernameError(t("complete_profile.username_invalid"));
      return;
    }
    if (trimmed.length < USERNAME_CONFIG.minLength) {
      setUsernameError(t("complete_profile.username_hint"));
      return;
    }
    if (trimmed === (displayUsername ?? "")) {
      setEditing(false);
      return;
    }
    if (usernameAvailability.available === false) {
      setUsernameError(
        usernameAvailability.message || t("complete_profile.username_taken"),
      );
      setUsernameAvailability({ checking: false, available: null, message: "" });
      return;
    }
    setUsernameSaving(true);
    try {
      const response = await authClient.updateUser({ displayUsername: trimmed });
      if (response.error) {
        throw new Error(
          parseErrorMessage(response.error, t("dashboard.username_save_error")),
        );
      }
      await onUpdated();
      setEditing(false);
    } catch (error) {
      setUsernameError(parseErrorMessage(error, t("dashboard.username_save_error")));
      setUsernameAvailability({ checking: false, available: null, message: "" });
    } finally {
      setUsernameSaving(false);
    }
  };

  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {t("dashboard.user_username_label")}
      </dt>
      <dd className="mt-1 text-sm text-foreground">
        {editing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={usernameValue}
              onChange={(event) => {
                setUsernameValue(event.target.value);
                if (usernameError) {
                  setUsernameError("");
                }
              }}
              minLength={USERNAME_CONFIG.minLength}
              maxLength={USERNAME_CONFIG.maxLength}
              pattern={USERNAME_CONFIG.pattern.source}
              className="block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={usernameSaving}
            />
            {usernameStatusMessage && (
              <p
                className={`text-xs ${
                  usernameAvailability.checking
                    ? "text-muted-foreground"
                    : usernameAvailability.available === true
                      ? "text-emerald-600"
                      : usernameAvailability.available === false
                        ? "text-destructive"
                        : "text-muted-foreground"
                }`}
              >
                {usernameStatusMessage}
              </p>
            )}
            {usernameError && (
              <p className="text-xs font-medium text-destructive">{usernameError}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveUsername}
                disabled={usernameSaving}
                className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
              >
                {t("dashboard.save_button")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setUsernameError("");
                }}
                disabled={usernameSaving}
                className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                {t("dashboard.cancel_button")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>{displayUsername || t("dashboard.not_provided")}</span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center rounded-full border border-border/70 px-2 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={t("dashboard.edit_button")}
            >
              {t("dashboard.edit_button")}
            </button>
          </div>
        )}
      </dd>
    </div>
  );
}

function PasswordSection() {
  const { t } = useTranslation("auth");
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleSavePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError(t("dashboard.password_current_required"));
      return;
    }
    if (!newPassword) {
      setPasswordError(t("dashboard.password_required"));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t("dashboard.password_hint"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("dashboard.password_mismatch"));
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      if (response.error) {
        throw new Error(
          parseErrorMessage(response.error, t("dashboard.password_update_error")),
        );
      }
      setPasswordSuccess(t("dashboard.password_update_success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setEditingPassword(false);
    } catch (error) {
      setPasswordError(parseErrorMessage(error, t("dashboard.password_update_error")));
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!AUTH_CONFIG.emailPassword.enabled) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
      <h2 className="text-xl font-semibold">{t("dashboard.security_title")}</h2>
      <div className="mt-4 space-y-3 text-sm text-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("dashboard.password_label")}
            </p>
            <p className="mt-1 text-sm text-foreground">••••••••</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingPassword((value) => !value);
              setPasswordError("");
              setPasswordSuccess("");
            }}
            className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {t("dashboard.edit_button")}
          </button>
        </div>
        {editingPassword && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4">
            <div>
              <label
                htmlFor="current-password"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {t("dashboard.password_current_label")}
              </label>
              <input
                name="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  if (passwordError) {
                    setPasswordError("");
                  }
                }}
                placeholder={t("dashboard.password_current_placeholder")}
                className="mt-2 block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={passwordSaving}
              />
            </div>
            <div>
              <label
                htmlFor="new-password"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {t("dashboard.password_new_label")}
              </label>
              <input
                name="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  if (passwordError) {
                    setPasswordError("");
                  }
                }}
                placeholder={t("dashboard.password_new_placeholder")}
                className="mt-2 block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={passwordSaving}
              />
            </div>
            <div>
              <label
                htmlFor="confirm-new-password"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {t("dashboard.password_confirm_label")}
              </label>
              <input
                name="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (passwordError) {
                    setPasswordError("");
                  }
                }}
                placeholder={t("dashboard.password_confirm_placeholder")}
                className="mt-2 block w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={passwordSaving}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.password_hint")}
            </p>
            {passwordError && (
              <p className="text-xs font-medium text-destructive">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-xs font-medium text-emerald-600">{passwordSuccess}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSavePassword}
                disabled={passwordSaving}
                className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
              >
                {passwordSaving
                  ? t("dashboard.password_saving_button")
                  : t("dashboard.password_save_button")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingPassword(false);
                  setPasswordError("");
                  setPasswordSuccess("");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={passwordSaving}
                className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                {t("dashboard.cancel_button")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { data: session, refetch } = useSession();
  const { t } = useTranslation("auth");

  if (!session) return null;
  const user = getExtendedUser(session.user);
  const role = getSessionUserRole(session);

  const handleProfileRefresh = async () => {
    await refetch();
  };

  return (
    <div className="app-surface flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("dashboard.title")}
            </h1>
            <p className="mt-2 text-muted-foreground">{t("dashboard.welcome")}</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
            <h2 className="text-xl font-semibold">{t("dashboard.user_info_title")}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <NameEditor name={user.name} onUpdated={handleProfileRefresh} />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("dashboard.email_label")}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("dashboard.email_verified_label")}
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {t("dashboard.verified_badge")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {t("dashboard.not_verified_badge")}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("dashboard.user_id_label")}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{user.id}</dd>
              </div>
              <UsernameEditor
                displayUsername={user.displayUsername}
                onUpdated={handleProfileRefresh}
              />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("dashboard.role_label")}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{role ?? "-"}</dd>
              </div>
            </dl>
          </div>

          <PasswordSection />

          <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
            <h2 className="text-xl font-semibold">{t("dashboard.actions_title")}</h2>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center rounded-full bg-destructive px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive/40"
              >
                {t("dashboard.sign_out_button")}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-primary/10 p-4">
            <p className="text-sm font-medium text-primary">
              {t("dashboard.protected_notice")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
