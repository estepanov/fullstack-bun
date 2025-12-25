import { z } from "zod";

/**
 * Validation schema for profile completion.
 * Add new required fields here as they're added to REQUIRED_USER_FIELDS.
 */
export const completeProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  // Future fields:
  // displayName: z.string().min(1).max(50),
  // phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
