import { adminClient, magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { SessionStore } from "./session-utils";

export function createAuthClientInstance(baseURL: string) {
  const authClient = createAuthClient({
    baseURL,
    basePath: "/auth",
    plugins: [adminClient(), magicLinkClient()],
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
    role: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};
