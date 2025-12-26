import { betterAuth } from "better-auth";
import { emailHarmony } from "better-auth-harmony";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createFieldAttribute } from "better-auth/db";
import { admin, lastLoginMethod, username } from "better-auth/plugins";
import { magicLink } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { LoginMethod } from "shared/auth/login-method";
import { completeProfileSchema } from "shared/auth/user-profile";
import { usernameField } from "shared/auth/user-profile-fields";
import { AUTH_CONFIG } from "shared/config/auth";
import { USERNAME_CONFIG } from "shared/config/user-profile";
import { validator } from "validation-better-auth";
import { db } from "../db/client";
import { account, session, user, verification } from "../db/schema";
import { env } from "../env";
import {
  sendMagicLinkEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "../utils/email";

// Define resources and actions for access control
const statement = {
  user: ["create", "read", "update", "delete", "list", "set-role", "ban", "unban"],
  session: ["list", "revoke", "delete"],
  impersonation: ["start", "stop"],
} as const;

const ac = createAccessControl(statement);
const usernameSchema = usernameField();

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

const plugins = [
  admin({
    ac,
    roles,
    defaultRole: "user",
    adminRoles: ["admin"],
    impersonationSessionDuration: 3600 / 2, // 30 minutes
    allowImpersonatingAdmins: true,
  }),
  username({
    minUsernameLength: USERNAME_CONFIG.minLength,
    maxUsernameLength: USERNAME_CONFIG.maxLength,
    usernameValidator: (username) => {
      return usernameSchema.safeParse(username).success;
    },
  }),
  emailHarmony(),
  lastLoginMethod({
    storeInDatabase: true,
    customResolveMethod: (ctx) => {
      if (ctx.path === "/magic-link/verify") {
        return LoginMethod.MAGIC_LINK;
      }
      // Return null to use default resolution
      return null;
    },
  }),
  validator([
    {
      path: "/update-user",
      schema: completeProfileSchema,
      before: (ctx) => {
        if (ctx.body?.username) {
          // so that a normalized version is always username
          throw new Error("set displayUsername instead");
        }
      },
    },
  ]),
];

if (AUTH_CONFIG.magicLink.enabled) {
  plugins.push(
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  );
}

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
        returned: true,
      }),
    },
  },
  plugins,
  baseURL: env.API_BASE_URL,
  basePath: AUTH_CONFIG.basePath,
  trustedOrigins: env.CORS_ALLOWLISTED_ORIGINS,
  account: {
    accountLinking: AUTH_CONFIG.accountLinking,
  },
  emailAndPassword: {
    enabled: AUTH_CONFIG.emailPassword.enabled,
    requireEmailVerification: true,
    minPasswordLength: AUTH_CONFIG.emailPassword.minPasswordLength,
    maxPasswordLength: AUTH_CONFIG.emailPassword.maxPasswordLength,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
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
      enabled:
        AUTH_CONFIG.social.github.enabled &&
        !!env.GITHUB_CLIENT_ID &&
        !!env.GITHUB_CLIENT_SECRET,
    },
  },
});

export type Auth = typeof auth;
export { ac };
