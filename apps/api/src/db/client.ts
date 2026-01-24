import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import { appLogger } from "../utils/logger";
import * as schema from "./schema";

const connectionString = env.DATABASE_URL;

// Configure connection pool for low-memory environments
const queryClient = postgres(connectionString, {
  max: 5, // Maximum 5 connections (default is 10)
  idle_timeout: 20, // Close idle connections after 20 seconds
  max_lifetime: 60 * 20, // Recycle connections after 20 minutes
});

const logDbConnectionStatus = async () => {
  try {
    await queryClient`SELECT 1`;
    appLogger.info("Database connection established");
  } catch (error) {
    appLogger.error({ error }, "Database connection failed");
  }
};

void logDbConnectionStatus();

export const db = drizzle(queryClient, { schema });
