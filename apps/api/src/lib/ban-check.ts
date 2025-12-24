import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { user as userTable } from "../db/schema";

/**
 * Check if a user has an active ban (for use in custom routes)
 * This replaces the old ban table query with user.banned field
 */
export async function checkUserBan(
  userId: string,
): Promise<{ banned: boolean; reason: string | null }> {
  const userData = await db
    .select({
      banned: userTable.banned,
      banReason: userTable.banReason,
      banExpires: userTable.banExpires,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!userData) {
    return { banned: false, reason: null };
  }

  // Check if banned and not expired
  const isBanned =
    userData.banned && (!userData.banExpires || userData.banExpires > new Date());

  return {
    banned: isBanned,
    reason: userData.banReason || null,
  };
}
