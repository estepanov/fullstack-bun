import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";

const connectionString = env.DATABASE_URL;

const queryClient = postgres(connectionString);

export const db = drizzle(queryClient);
