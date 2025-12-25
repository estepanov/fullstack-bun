import { REQUIRED_USER_FIELDS, type RequiredUserField } from "shared/config/user-profile";
import type { auth } from "../lib/auth";

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
type AuthedUser = AuthSession["user"];

// Re-export from shared config for backwards compatibility
export { REQUIRED_USER_FIELDS, type RequiredUserField };

/**
 * Checks if a user has all required profile fields filled out.
 *
 * @param user - The authenticated user object
 * @returns Array of missing required field names (empty if profile is complete)
 *
 * @example
 * ```typescript
 * const missingFields = getMissingFields(c.var.user);
 * if (missingFields.length > 0) {
 *   // Redirect to profile completion
 * }
 * ```
 */
export function getMissingFields(user: AuthedUser): RequiredUserField[] {
  const missing: RequiredUserField[] = [];

  for (const field of REQUIRED_USER_FIELDS) {
    const value = user[field as keyof AuthedUser];

    // Check if field is missing or empty string
    if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      missing.push(field);
    }
  }

  return missing;
}

/**
 * Checks if a user's profile is complete (all required fields filled).
 *
 * @param user - The authenticated user object
 * @returns true if profile is complete, false otherwise
 */
export function isProfileComplete(user: AuthedUser): boolean {
  return getMissingFields(user).length === 0;
}
