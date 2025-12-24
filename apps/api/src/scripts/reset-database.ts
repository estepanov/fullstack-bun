import { sql } from "drizzle-orm";
import { db } from "../db/client";

async function resetDatabase() {
  console.log("⚠️  WARNING: This will drop ALL tables and data!");
  console.log("Starting database reset in 3 seconds...\n");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    // Drop all tables
    console.log("Dropping all tables...");

    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "account" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "session" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "user" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "verification" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "ban" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "message" CASCADE`);

    console.log("✓ All tables dropped\n");

    // Drop enums if they exist
    console.log("Dropping enums...");
    await db.execute(sql`DROP TYPE IF EXISTS "user_role" CASCADE`);
    console.log("✓ Enums dropped\n");

    console.log("✅ Database reset complete!");
    console.log("\nNext steps:");
    console.log("1. Run: bun run db:migrate");
    console.log("2. Run: bun src/scripts/migrate-bans.ts (for role conversion)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  }
}

resetDatabase();
