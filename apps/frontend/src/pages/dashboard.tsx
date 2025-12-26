import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GET_USER_PROFILE_QUERY_KEY } from "@/hooks/api/query-key";
import { useGetUserProfileQuery } from "@/hooks/api/useGetUserProfileQuery";
import { apiClient } from "@/lib/api-client";
import { authClient, signOut, useSession } from "@/lib/auth-client";
import { getExtendedUser } from "@/types/user";
import { useQueryClient } from "@tanstack/react-query";
import { getSessionUserRole } from "frontend-common/auth";
import { useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { LoginMethod } from "shared/auth/login-method";
import { AUTH_CONFIG } from "shared/config/auth";
import { USERNAME_CONFIG } from "shared/config/user-profile";

type UpdateCallback = () => Promise<void>;
type SessionRecord = {
  id: string;
  userId: string;
  expiresAt: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  impersonatedBy?: string | null;
};
type AccountRecord = {
  id: string;
  providerId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  accountId: string;
  userId: string;
  scopes: string[];
};
type PasskeyRecord = {
  id: string;
  name?: string | null;
  publicKey: string;
  userId: string;
  credentialID: string;
  counter: number;
  deviceType: string;
  backedUp: boolean;
  transports?: string | null;
  createdAt?: string | Date | null;
  aaguid?: string | null;
};

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

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const formatProviderLabel = (providerId: string) => {
  return providerId.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

function NameEditor({
  name,
  onUpdated,
}: { name?: string | null; onUpdated: UpdateCallback }) {
  const { t } = useTranslation("auth");
  const inputId = "dashboard-name";
  const errorId = "dashboard-name-error";
  const labelId = "dashboard-name-label";
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
      <dt
        id={labelId}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        {t("dashboard.name_label")}
      </dt>
      <dd className="mt-1 text-sm text-foreground">
        {editing ? (
          <div className="space-y-2">
            <input
              id={inputId}
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
              aria-invalid={nameError ? true : undefined}
              aria-labelledby={labelId}
              aria-describedby={nameError ? errorId : undefined}
            />
            {nameError && (
              <p
                id={errorId}
                role="alert"
                className="text-xs font-medium text-destructive"
              >
                {nameError}
              </p>
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
  const inputId = "dashboard-username";
  const statusId = "dashboard-username-status";
  const errorId = "dashboard-username-error";
  const labelId = "dashboard-username-label";
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
      <dt
        id={labelId}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        {t("dashboard.user_username_label")}
      </dt>
      <dd className="mt-1 text-sm text-foreground">
        {editing ? (
          <div className="space-y-2">
            <input
              id={inputId}
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
              aria-invalid={usernameError ? true : undefined}
              aria-labelledby={labelId}
              aria-describedby={
                [usernameStatusMessage ? statusId : "", usernameError ? errorId : ""]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
            />
            {usernameStatusMessage && (
              <p
                id={statusId}
                role={usernameAvailability.checking ? "status" : undefined}
                aria-live={usernameAvailability.checking ? "polite" : undefined}
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
              <p
                id={errorId}
                role="alert"
                className="text-xs font-medium text-destructive"
              >
                {usernameError}
              </p>
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

function PasswordSection({
  hasPassword,
  email,
}: { hasPassword: boolean; email?: string }) {
  const { t } = useTranslation("auth");
  const passwordMinLength = AUTH_CONFIG.emailPassword.minPasswordLength;
  const currentPasswordId = "dashboard-current-password";
  const newPasswordId = "dashboard-new-password";
  const confirmPasswordId = "dashboard-confirm-password";
  const errorId = "dashboard-password-error";
  const successId = "dashboard-password-success";
  const panelId = "dashboard-password-panel";
  const [sentPasswordResetEmail, setSentPasswordResetEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const queryClient = useQueryClient();
  const resetRedirectTo =
    typeof window === "undefined" ? "" : `${window.location.origin}/auth/reset-password`;

  const handleSavePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!newPassword) {
      setPasswordError(t("dashboard.password_required"));
      return;
    }
    if (newPassword.length < passwordMinLength) {
      setPasswordError(t("dashboard.password_hint", { minLength: passwordMinLength }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("dashboard.password_mismatch"));
      return;
    }

    // If user has a password, require current password
    if (hasPassword && !currentPassword) {
      setPasswordError(t("dashboard.password_current_required"));
      return;
    }

    setPasswordSaving(true);
    try {
      if (hasPassword) {
        // User has password - use changePassword
        const response = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions,
        });

        if (response.error) {
          throw new Error(
            parseErrorMessage(response.error, t("dashboard.password_update_error")),
          );
        }
      } else {
        // User doesn't have password - use setPassword endpoint
        const response = await apiClient.user["set-password"].$post({
          json: { newPassword },
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(
            parseErrorMessage(data.error, t("dashboard.password_update_error")),
          );
        }

        await queryClient.invalidateQueries({
          queryKey: [GET_USER_PROFILE_QUERY_KEY],
        });
      }

      setPasswordSuccess(t("dashboard.password_update_success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setRevokeOtherSessions(false);
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
            <p className="mt-1 text-sm text-foreground">
              {hasPassword ? (
                "••••••••"
              ) : (
                <span className="italic"> {t("dashboard.password_not_set")}</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingPassword((value) => !value);
              setPasswordError("");
              setPasswordSuccess("");
            }}
            className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-expanded={editingPassword}
            aria-controls={panelId}
          >
            {editingPassword ? t("dashboard.cancel_button") : t("dashboard.edit_button")}
          </button>
        </div>
        {editingPassword && (
          <div
            id={panelId}
            className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4"
          >
            {hasPassword && (
              <div>
                <label
                  htmlFor={currentPasswordId}
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                >
                  {t("dashboard.password_current_label")}
                </label>
                <input
                  id={currentPasswordId}
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
                  required
                  aria-invalid={passwordError ? true : undefined}
                  aria-describedby={passwordError ? errorId : undefined}
                />
                {email && (
                  <p className="text-xs mt-2 text-muted-foreground">
                    {sentPasswordResetEmail ? (
                      <>
                        <Trans
                          i18nKey="dashboard.password_current_forgot_email_sent"
                          ns="auth"
                          values={{ email }}
                          components={{
                            address: <span className="font-semibold" />,
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <Trans
                          i18nKey="dashboard.password_current_forgot"
                          ns="auth"
                          components={{
                            forgotLink: (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    if (!resetRedirectTo) {
                                      return;
                                    }
                                    await authClient.requestPasswordReset({
                                      email,
                                      redirectTo: resetRedirectTo,
                                    });
                                    setSentPasswordResetEmail(true);
                                  } catch (error) {
                                    console.error(error);
                                  }
                                }}
                                className="font-semibold text-primary hover:underline dark:text-primary"
                              />
                            ),
                          }}
                        />
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor={newPasswordId}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {t("dashboard.password_new_label")}
              </label>
              <input
                id={newPasswordId}
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
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? errorId : undefined}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.password_hint", { minLength: passwordMinLength })}
            </p>
            <div>
              <label
                htmlFor={confirmPasswordId}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                {t("dashboard.password_confirm_label")}
              </label>
              <input
                id={confirmPasswordId}
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
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? errorId : undefined}
              />
            </div>

            {hasPassword && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <input
                  id="revoke-other-sessions"
                  name="revoke-other-sessions"
                  type="checkbox"
                  checked={revokeOtherSessions}
                  onChange={(event) => {
                    setRevokeOtherSessions(event.target.checked);
                  }}
                  disabled={passwordSaving}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                />
                <label htmlFor="revoke-other-sessions">
                  {t("dashboard.password_revoke_other_sessions_label")}
                </label>
              </div>
            )}
            {passwordError && (
              <p
                id={errorId}
                role="alert"
                className="text-xs font-medium text-destructive"
              >
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p
                id={successId}
                role="status"
                aria-live="polite"
                className="text-xs font-medium text-emerald-600"
              >
                {passwordSuccess}
              </p>
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
                  setRevokeOtherSessions(false);
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

function SessionsSection() {
  const { t } = useTranslation("auth");
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState(false);

  const currentSessionId = session?.session?.id;

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (a.id === currentSessionId) return -1;
      if (b.id === currentSessionId) return 1;
      const aExpires = new Date(a.expiresAt).getTime();
      const bExpires = new Date(b.expiresAt).getTime();
      return bExpires - aExpires;
    });
  }, [currentSessionId, sessions]);

  const loadSessions = async () => {
    setLoading(true);
    setError("");
    const response = await authClient.listSessions();
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.sessions_load_error")));
      setSessions([]);
    } else {
      setSessions((response.data as SessionRecord[]) ?? []);
    }
    setLoading(false);
  };

  const handleRevokeOtherSessions = async () => {
    setRevoking(true);
    setError("");
    const response = await authClient.revokeOtherSessions();
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.sessions_revoke_error")));
    } else {
      await loadSessions();
    }
    setRevoking(false);
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  return (
    <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("dashboard.sessions_title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("dashboard.sessions_description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button
            type="button"
            onClick={loadSessions}
            className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={loading}
          >
            {loading
              ? t("dashboard.sessions_refreshing_button")
              : t("dashboard.sessions_refresh_button")}
          </button>
          <button
            type="button"
            onClick={handleRevokeOtherSessions}
            className="inline-flex items-center rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive/40 disabled:opacity-50"
            disabled={revoking}
          >
            {revoking
              ? t("dashboard.sessions_revoking_button")
              : t("dashboard.sessions_revoke_other_button")}
          </button>
        </div>
      </div>
      {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}
      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.sessions_loading")}
          </p>
        ) : sortedSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboard.sessions_empty")}</p>
        ) : (
          sortedSessions.map((sessionItem) => {
            const isCurrent = sessionItem.id === currentSessionId;
            return (
              <div
                key={sessionItem.id}
                className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm relative"
              >
                {isCurrent && (
                  <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {t("dashboard.sessions_current_badge")}
                  </span>
                )}
                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.sessions_expires_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDateTime(sessionItem.expiresAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.sessions_created_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDateTime(sessionItem.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.sessions_ip_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {sessionItem.ipAddress || "-"}
                    </p>
                  </div>
                  <div className="sm:col-span-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.sessions_user_agent_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground wrap-break-words">
                      {sessionItem.userAgent || "-"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PasskeysSection() {
  const { t } = useTranslation("auth");
  const [showAddForm, setShowAddForm] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const sortedPasskeys = useMemo(() => {
    return [...passkeys].sort((a, b) => {
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreated - aCreated;
    });
  }, [passkeys]);

  const loadPasskeys = async () => {
    setLoading(true);
    setError("");
    const response = await authClient.passkey.listUserPasskeys({});
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.passkeys_load_error")));
      setPasskeys([]);
    } else {
      setPasskeys((response.data as PasskeyRecord[]) ?? []);
    }
    setLoading(false);
  };

  const handleAddPasskey = async () => {
    setAdding(true);
    setError("");
    const trimmedName = name.trim();
    const response = await authClient.passkey.addPasskey({
      name: trimmedName || undefined,
    });
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.passkeys_add_error")));
    } else {
      setName("");
      await loadPasskeys();
    }
    setAdding(false);
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    setDeletingId(passkeyId);
    setError("");
    const response = await authClient.passkey.deletePasskey({ id: passkeyId });
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.passkeys_delete_error")));
    } else {
      await loadPasskeys();
    }
    setDeletingId(null);
  };

  useEffect(() => {
    void loadPasskeys();
  }, []);

  return (
    <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("dashboard.passkeys_title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("dashboard.passkeys_description")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm((curr) => !curr)}
            className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={loading}
          >
            {showAddForm ? "Hide new passkey form" : "Add new passkey"}
          </button>
          <button
            type="button"
            onClick={loadPasskeys}
            className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={loading}
          >
            {loading
              ? t("dashboard.passkeys_refreshing_button")
              : t("dashboard.passkeys_refresh_button")}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4 mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("dashboard.passkeys_name_label")}
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={adding}
              placeholder={t("dashboard.passkeys_name_placeholder")}
            />
          </label>
          <div className="flex flex-col justify-end mb-3">
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                handleAddPasskey();
              }}
              disabled={adding}
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            >
              {adding
                ? t("dashboard.passkeys_adding_button")
                : t("dashboard.passkeys_add_button")}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.passkeys_loading")}
          </p>
        ) : sortedPasskeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dashboard.passkeys_empty")}</p>
        ) : (
          sortedPasskeys.map((passkey) => {
            const isDeleting = deletingId === passkey.id;
            return (
              <div
                key={passkey.id}
                className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("dashboard.passkeys_name_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {passkey.name || t("dashboard.passkeys_name_fallback")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePasskey(passkey.id)}
                    disabled={isDeleting}
                    className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                  >
                    {isDeleting
                      ? t("dashboard.passkeys_deleting_button")
                      : t("dashboard.passkeys_delete_button")}
                  </button>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.passkeys_device_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatProviderLabel(passkey.deviceType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.passkeys_backed_up_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {passkey.backedUp
                        ? t("dashboard.passkeys_backed_up_yes")
                        : t("dashboard.passkeys_backed_up_no")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.passkeys_created_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDateTime(passkey.createdAt)}
                    </p>
                  </div>
                  {passkey.transports ? (
                    <div className="sm:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                        {t("dashboard.passkeys_transports_label")}
                      </p>
                      <p className="mt-1 text-sm text-foreground wrap-break-words">
                        {passkey.transports}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AccountsSection() {
  const { t } = useTranslation("auth");
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const sortedAccounts = useMemo(() => {
    return [...accounts]
      .filter((acc) => acc.providerId !== "credential")
      .sort((a, b) => {
        const aCreated = new Date(a.createdAt).getTime();
        const bCreated = new Date(b.createdAt).getTime();
        return bCreated - aCreated;
      });
  }, [accounts]);

  const loadAccounts = async () => {
    setLoading(true);
    setError("");
    const response = await authClient.listAccounts();
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.accounts_load_error")));
      setAccounts([]);
    } else {
      setAccounts((response.data as AccountRecord[]) ?? []);
    }
    setLoading(false);
  };

  const handleUnlink = async (account: AccountRecord) => {
    setUnlinkingId(account.id);
    setError("");
    const response = await authClient.unlinkAccount({
      providerId: account.providerId,
      accountId: account.accountId,
    });
    if (response.error) {
      setError(parseErrorMessage(response.error, t("dashboard.accounts_unlink_error")));
    } else {
      await loadAccounts();
    }
    setUnlinkingId(null);
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  return (
    <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
      <div>
        <h2 className="text-xl font-semibold">{t("dashboard.accounts_title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("dashboard.accounts_description")}
        </p>
      </div>
      {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}
      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.accounts_loading")}
          </p>
        ) : sortedAccounts.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            {t("dashboard.accounts_empty")}
          </p>
        ) : (
          sortedAccounts.map((account) => {
            const isUnlinking = unlinkingId === account.id;
            return (
              <div
                key={account.id}
                className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("dashboard.accounts_provider_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatProviderLabel(account.providerId)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnlink(account)}
                    className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                    disabled={isUnlinking}
                  >
                    {isUnlinking
                      ? t("dashboard.accounts_unlinking_button")
                      : t("dashboard.accounts_unlink_button")}
                  </button>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.accounts_account_id_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground wrap-break-words">
                      {account.accountId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                      {t("dashboard.accounts_linked_label")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDateTime(account.createdAt)}
                    </p>
                  </div>
                  {account.scopes?.length ? (
                    <div className="sm:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                        {t("dashboard.accounts_scopes_label")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {account.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-foreground"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { data: session, refetch } = useSession();
  const { data: userProfile } = useGetUserProfileQuery();
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
              {typeof userProfile?.role === "string" && userProfile.role !== "user" && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("dashboard.role_label")}
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">{role}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("dashboard.last_login_method_label")}
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {user.lastLoginMethod ? (
                    user.lastLoginMethod === LoginMethod.MAGIC_LINK ? (
                      t("dashboard.last_login_method_magic_link")
                    ) : user.lastLoginMethod === LoginMethod.PASSKEY ? (
                      t("dashboard.last_login_method_passkey")
                    ) : (
                      user.lastLoginMethod.charAt(0).toUpperCase() +
                      user.lastLoginMethod.slice(1)
                    )
                  ) : (
                    <span className="italic">
                      {t("dashboard.last_login_method_not_set")}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <PasswordSection
            email={userProfile?.email}
            hasPassword={!!userProfile?.hasPassword}
          />
          {AUTH_CONFIG.passkey.enabled && <PasskeysSection />}
          <SessionsSection />
          {AUTH_CONFIG.accountLinking.enabled && <AccountsSection />}

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
