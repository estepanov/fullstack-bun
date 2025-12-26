import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { account } from "../db/schema";
import { AUTH_CONFIG } from "shared/config/auth";

/**
 * Check if a user has a password-based credential account.
 * Returns false if password authentication is disabled in config.
 *
 * @param userId - The user ID to check
 * @returns Promise resolving to true if user has a credential account, false otherwise
 */
export async function checkUserHasPassword(userId: string): Promise<boolean> {
  // If password auth is disabled, skip the query
  if (!AUTH_CONFIG.emailPassword.enabled) {
    return false;
  }

  const credentialAccount = await db.query.account.findFirst({
    where: eq(account.userId, userId),
    columns: {
      providerId: true,
    },
  });

  return credentialAccount?.providerId === "credential";
}
