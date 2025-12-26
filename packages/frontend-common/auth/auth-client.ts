import { adminClient, magicLinkClient, usernameClient, lastLoginMethodClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { AUTH_CONFIG } from "shared/config/auth";
import { SessionStore } from "./session-utils";

export function createAuthClientInstance(baseURL: string) {
  const authClient = createAuthClient({
    baseURL,
    basePath: AUTH_CONFIG.basePath,
    plugins: [adminClient(), magicLinkClient(), usernameClient(), lastLoginMethodClient()],
    fetchOptions: {
      onRequest: (ctx) => {
        const sessionStore = new SessionStore();
        ctx.headers.append("x-session-id", sessionStore.getSessionId());
        ctx.headers.append("x-request-id", crypto.randomUUID());
      },
    },
  });

  return authClient;
}

// Re-export type for sessions
export type FESession = {
  user: {
    id: string;
    email: string;
    name: string;
    username: string | undefined;
    displayUsername: string | undefined;
    role: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginMethod?: string | null;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};
