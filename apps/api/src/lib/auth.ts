import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createFieldAttribute } from "better-auth/db";
import { UserRole } from "shared/auth/user-role";
import { db } from "../db/client";
import { account, session, user, verification } from "../db/schema";
import { env } from "../env";
import { sendVerificationEmail } from "../utils/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  user: {
    additionalFields: {
      role: createFieldAttribute("string", {
        required: true,
        defaultValue: UserRole.USER,
        input: false,
      }),
    },
  },
  baseURL: env.FE_BASE_URL,
  basePath: "/auth",
  trustedOrigins: env.CORS_ALLOWLISTED_ORIGINS,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Send email using nodemailer
      // Avoid awaiting the email sending to prevent timing attacks. On serverless platforms, use waitUntil or similar to ensure the email is sent.
      // https://www.better-auth.com/docs/authentication/email-password#email-verification
      await sendVerificationEmail(user.email, url);
    },
  },
  // Optional: Add social providers
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID || "",
      clientSecret: env.GITHUB_CLIENT_SECRET || "",
      enabled: !!env.GITHUB_CLIENT_ID,
    },
  },
});

export type Auth = typeof auth;
