import { z } from "zod";
import { displayUsernameField, nameField, usernameField } from "./user-profile-fields";

export const userProfileFields = {
  name: nameField().optional(),
  username: usernameField().optional(),
  displayUsername: displayUsernameField().optional(),
} satisfies z.ZodRawShape;

/**
 * Validation schema for profile completion.
 * Add new required fields here as they're added to REQUIRED_USER_FIELDS.
 *
 * Note: Username validation and normalization is handled by better-auth's username plugin.
 */
export const completeProfileSchema = z.object(userProfileFields);

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
