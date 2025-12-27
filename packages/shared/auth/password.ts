import { z } from "zod";
import { AUTH_CONFIG } from "../config/auth";

/**
 * Password validation schema based on AUTH_CONFIG settings
 */
export const passwordField = () =>
  z
    .string()
    .min(
      AUTH_CONFIG.emailPassword.minPasswordLength,
      `Password must be at least ${AUTH_CONFIG.emailPassword.minPasswordLength} characters`,
    )
    .max(
      AUTH_CONFIG.emailPassword.maxPasswordLength,
      `Password must be at most ${AUTH_CONFIG.emailPassword.maxPasswordLength} characters`,
    );

/**
 * Schema for setting a new password (OAuth users without password)
 */
export const setPasswordSchema = ({
  passwordTooShort = `Password must be at least ${AUTH_CONFIG.emailPassword.minPasswordLength} characters`,
  passwordTooLong = `Password must be at most ${AUTH_CONFIG.emailPassword.maxPasswordLength} characters`,
  passwordRequired = "Password is required",
}: {
  passwordTooShort?: string;
  passwordTooLong?: string;
  passwordRequired?: string;
} = {}) =>
  z.object({
    newPassword: z
      .string()
      .min(1, passwordRequired)
      .min(AUTH_CONFIG.emailPassword.minPasswordLength, passwordTooShort)
      .max(AUTH_CONFIG.emailPassword.maxPasswordLength, passwordTooLong),
  });

/**
 * Schema for changing an existing password
 */
export const changePasswordSchema = ({
  currentPasswordRequired = "Current password is required",
  passwordTooShort = `Password must be at least ${AUTH_CONFIG.emailPassword.minPasswordLength} characters`,
  passwordTooLong = `Password must be at most ${AUTH_CONFIG.emailPassword.maxPasswordLength} characters`,
  passwordRequired = "Password is required",
}: {
  currentPasswordRequired?: string;
  passwordTooShort?: string;
  passwordTooLong?: string;
  passwordRequired?: string;
} = {}) =>
  z.object({
    currentPassword: z.string().min(1, currentPasswordRequired),
    newPassword: z
      .string()
      .min(1, passwordRequired)
      .min(AUTH_CONFIG.emailPassword.minPasswordLength, passwordTooShort)
      .max(AUTH_CONFIG.emailPassword.maxPasswordLength, passwordTooLong),
    revokeOtherSessions: z.boolean().optional(),
  });

export type SetPasswordInput = z.infer<ReturnType<typeof setPasswordSchema>>;
export type ChangePasswordInput = z.infer<ReturnType<typeof changePasswordSchema>>;
