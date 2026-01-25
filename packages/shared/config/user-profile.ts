/**
 * Shared configuration for user profile settings.
 * This file centralizes all user profile-related configuration
 * to ensure consistency across frontend and backend.
 */

/**
 * Username validation constraints
 */
export const USERNAME_CONFIG = {
  minLength: 3,
  maxLength: 30,
  pattern: /^[a-zA-Z0-9_-]+$/,
  patternDescription:
    "Username can only contain letters, numbers, underscores, and hyphens",
} as const;

/**
 * List of required user profile fields.
 * Users missing any of these fields will be redirected to complete their profile.
 *
 * To add a new required field:
 * 1. Add the field name to this array
 * 2. Update the database schema if needed
 * 3. Update the frontend profile completion form
 *
 * Note: We check for displayUsername (not username) because:
 * - displayUsername is what users explicitly set and what's shown in chat
 * - better-auth's username plugin auto-manages the normalized username field
 */
export const REQUIRED_USER_FIELDS = ["name", "displayUsername"] as const;

export type RequiredUserField = (typeof REQUIRED_USER_FIELDS)[number];

export const RESERVED_NAMES = new Set(["admin", "administrator", "support", "help"]);
