import { createAuthClient } from "better-auth/react";
import { SessionStore } from "./session-utils";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_BASE_URL, // http://localhost:3001
  basePath: "/auth",
  fetchOptions: {
    onRequest: (ctx) => {
      const sessionStore = new SessionStore();
      ctx.headers.append("x-session-id", sessionStore.getSessionId());
      ctx.headers.append("x-request-id", crypto.randomUUID());
    },
  },
});

// Export hooks for easy use throughout the app
export const { useSession, signIn, signUp, signOut, resetPassword, verifyEmail } =
  authClient;
