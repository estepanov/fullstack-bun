import { z } from "zod";

/**
 * Validation schema for profile completion.
 * Add new required fields here as they're added to REQUIRED_USER_FIELDS.
 * Fields are optional to allow partial updates (only send missing fields).
 *
 * Note: Username validation and normalization is handled by better-auth's username plugin.
 */
export const completeProfileSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less")
      .optional(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be 30 characters or less")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens"
      )
      .optional(),
    displayUsername: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be 30 characters or less")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens"
      )
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.username !== undefined, {
    message: "At least one field must be provided",
  });

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
