import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import { appLogger } from "../utils/logger";
import * as schema from "./schema";

const connectionString = env.DATABASE_URL;

const queryClient = postgres(connectionString);

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
