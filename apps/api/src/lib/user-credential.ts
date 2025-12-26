import { and, eq } from "drizzle-orm";
import { AUTH_CONFIG } from "shared/config/auth";
import { db } from "../db/client";
import { account } from "../db/schema";

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
    where: and(eq(account.userId, userId), eq(account.providerId, "credential")),
    columns: {
      providerId: true,
    },
  });

  return credentialAccount?.providerId === "credential";
}
