import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Server Configuration
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3001),
    CORS_ALLOWLISTED_ORIGINS: z
      .string()
      .min(1)
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean),
      ),

    // Database
    DATABASE_URL: z.string().min(4),

    // Redis
    REDIS_URL: z.string().min(4),

    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(32),
    FE_BASE_URL: z.string().min(4),

    // Email (SMTP) - Optional
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (!value) return true;
          const simpleEmail = z.string().email().safeParse(value).success;
          const namedEmail = /^[^<>@]+<[^<>@]+@[^<>@]+>$/.test(value);
          return simpleEmail || namedEmail;
        },
        {
          message:
            "SMTP_FROM must be an email address or 'Example App <noreply@example.com>'",
        },
      ),

    // OAuth - Optional
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export const isDevelopmentEnv = () => env.NODE_ENV === "development";
