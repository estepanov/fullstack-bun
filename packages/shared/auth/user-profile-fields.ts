import { z } from "zod";
import { RESERVED_NAMES, USERNAME_CONFIG } from "../config/user-profile";

export const nameField = () =>
  z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less");

const isReservedUsername = (value: string) => {
  const normalized = value.normalize("NFKC").replace(/\s+/g, "").trim().toLowerCase();
  return RESERVED_NAMES.has(normalized);
};

export const usernameField = () =>
  z
    .string()
    .min(
      USERNAME_CONFIG.minLength,
      `Username must be at least ${USERNAME_CONFIG.minLength} characters`,
    )
    .max(
      USERNAME_CONFIG.maxLength,
      `Username must be ${USERNAME_CONFIG.maxLength} characters or less`,
    )
    .regex(USERNAME_CONFIG.pattern, USERNAME_CONFIG.patternDescription)
    .refine(
      (value) => !isReservedUsername(value),
      "Username cannot be admin or administrator",
    );

export const displayUsernameField = () =>
  z
    .string()
    .min(
      USERNAME_CONFIG.minLength,
      `Username must be at least ${USERNAME_CONFIG.minLength} characters`,
    )
    .max(
      USERNAME_CONFIG.maxLength,
      `Username must be ${USERNAME_CONFIG.maxLength} characters or less`,
    )
    .regex(USERNAME_CONFIG.pattern, USERNAME_CONFIG.patternDescription)
    .refine(
      (value) => !isReservedUsername(value),
      "Username cannot be admin or administrator",
    );
