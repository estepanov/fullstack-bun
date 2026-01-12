import { createAuthClientInstance } from "frontend-common/auth";

export const authClient = createAuthClientInstance(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
);

// Export hooks for easy use throughout the app
export const {
  useSession,
  signIn: originalSignIn,
  signUp,
  signOut,
  resetPassword,
  verifyEmail,
  sendVerificationEmail,
} = authClient;

// Wrapper for signIn that handles email verification
export const signIn = {
  ...originalSignIn,
  email: async (
    credentials: { email: string; password: string },
    options?: {
      onSuccess?: () => void;
      onError?: (ctx: { error: { message?: string; status?: number } }) => void;
    },
  ) => {
    return originalSignIn.email(credentials, {
      onSuccess: options?.onSuccess,
      onError: async (ctx) => {
        // Check if the error is due to unverified email
        if (
          ctx.error.message?.toLowerCase().includes("email") &&
          ctx.error.message?.toLowerCase().includes("verif")
        ) {
          // Automatically resend verification email
          try {
            await sendVerificationEmail({ email: credentials.email });
            // Update error message to inform user
            ctx.error.message =
              "Please verify your email. A new verification email has been sent.";
          } catch (resendError) {
            // If resending fails, keep original error
            console.error("Failed to resend verification email:", resendError);
          }
        }
        // Call the original error handler with potentially updated message
        options?.onError?.(ctx);
      },
    });
  },
};

export type FESession = NonNullable<ReturnType<typeof useSession>["data"]>;
