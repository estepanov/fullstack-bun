import { z } from "zod";
import { AUTH_CONFIG } from "shared/config/auth";
import { nameField, displayUsernameField } from "shared/auth/user-profile-fields";

// Name editor schema
export const nameSchema = z.object({
  name: nameField(),
});

export type NameFormData = z.infer<typeof nameSchema>;

// Username editor schema
export const usernameSchema = z.object({
  displayUsername: displayUsernameField(),
});

export type UsernameFormData = z.infer<typeof usernameSchema>;

// Password schema - always includes all fields but validates conditionally
export const createPasswordSchema = (hasPassword: boolean) => {
  return z
    .object({
      currentPassword: z.string(),
      newPassword: z
        .string()
        .min(
          AUTH_CONFIG.emailPassword.minPasswordLength,
          `Password must be at least ${AUTH_CONFIG.emailPassword.minPasswordLength} characters`,
        )
        .max(
          AUTH_CONFIG.emailPassword.maxPasswordLength,
          `Password must be ${AUTH_CONFIG.emailPassword.maxPasswordLength} characters or less`,
        ),
      confirmPassword: z.string(),
      revokeOtherSessions: z.boolean(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords must match",
      path: ["confirmPassword"],
    })
    .refine(
      (data) => {
        // Only validate currentPassword if user has a password
        if (hasPassword && !data.currentPassword) {
          return false;
        }
        return true;
      },
      {
        message: "Current password is required",
        path: ["currentPassword"],
      },
    );
};

export type PasswordFormData = z.infer<ReturnType<typeof createPasswordSchema>>;

// Passkey schema - name is optional but we use empty string for form handling
export const passkeySchema = z.object({
  name: z.string(),
});

export type PasskeyFormData = z.infer<typeof passkeySchema>;
