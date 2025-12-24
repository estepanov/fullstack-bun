import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createFieldAttribute } from "better-auth/db";
import { admin } from "better-auth/plugins";
import { magicLink } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { db } from "../db/client";
import { account, session, user, verification } from "../db/schema";
import { env } from "../env";
import { sendMagicLinkEmail, sendVerificationEmail } from "../utils/email";

// Define resources and actions for access control
const statement = {
  user: ["create", "read", "update", "delete", "list", "set-role", "ban", "unban"],
  session: ["list", "revoke", "delete"],
  impersonation: ["start", "stop"],
} as const;

const ac = createAccessControl(statement);

// Define roles with granular permissions
export const roles = {
  admin: ac.newRole({
    user: ["create", "read", "update", "delete", "list", "set-role", "ban", "unban"],
    session: ["list", "revoke", "delete"],
    impersonation: ["start", "stop"],
  }),
  moderator: ac.newRole({
    user: ["read", "list", "ban", "unban"],
    session: ["list"],
    impersonation: [],
  }),
  user: ac.newRole({
    user: ["read"],
    session: [],
    impersonation: [],
  }),
};

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
        defaultValue: "user",
        input: false,
      }),
    },
  },
  plugins: [
    admin({
      ac,
      roles,
      defaultRole: "user",
      adminRoles: ["admin"],
      impersonationSessionDuration: 3600 / 2, // 30 minutes
      allowImpersonatingAdmins: true,
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],
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
export { ac };
