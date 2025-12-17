import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
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
  baseURL: env.FE_BASE_URL,
  basePath: "/auth",
  trustedOrigins: env.CORS_ALLOWLISTED_ORIGINS,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Send email using nodemailer
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
