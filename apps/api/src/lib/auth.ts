import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/client";
import { account, session, user, verification } from "../db/schema";
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
  baseURL: process.env.FE_BASE_URL,
  basePath: "/auth",
  trustedOrigins: process.env.CORS_ALLOWLISTED_ORIGINS
    ? process.env.CORS_ALLOWLISTED_ORIGINS.split(",").map((origin) =>
        origin.trim().replace(/^["']|["']$/g, ""),
      )
    : [],
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
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      enabled: !!process.env.GITHUB_CLIENT_ID,
    },
  },
});

export type Auth = typeof auth;
