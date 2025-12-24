import { sql } from "drizzle-orm";
import { db } from "../db/client";

async function checkMigrations() {
  const migrations = await db.execute(sql`
    SELECT * FROM drizzle.__drizzle_migrations
    ORDER BY created_at DESC
  `);

  console.log("Applied migrations:");
  console.log(JSON.stringify(migrations, null, 2));

  process.exit(0);
}

checkMigrations().catch((error) => {
  console.error("Failed to check migrations:", error);
  process.exit(1);
});
