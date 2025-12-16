import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";

// Get database URL from environment
const connectionString = env.DATABASE_URL;

// Create connection with validated DATABASE_URL
const queryClient = postgres(connectionString);

// Create Drizzle instance
export const db = drizzle(queryClient);
