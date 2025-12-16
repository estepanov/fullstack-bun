import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Get database URL from environment
const connectionString = process.env.DATABASE_URL || "";

// Only create connection if DATABASE_URL is set
// This allows schema generation to work without a database connection
const queryClient = connectionString ? postgres(connectionString) : ({} as never);

// Create Drizzle instance
export const db = drizzle(queryClient);
