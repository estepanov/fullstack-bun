import { createAuthClientInstance } from "frontend-common/auth";

export const authClient = createAuthClientInstance(import.meta.env.VITE_API_BASE_URL);

// Export hooks for easy use throughout the app
export const { useSession, signIn, signUp, signOut, resetPassword, verifyEmail } =
  authClient;

export type FESession = NonNullable<ReturnType<typeof useSession>["data"]>;
