/**
 * Shared authentication configuration.
 * Update these values to enable/disable auth features across apps.
 * This will require rebooting backend and rebuilding any frontends
 */
export type AuthConfig = {
  emailPassword: {
    /**
     * Enable email + password sign-in and sign-up flows.
     */
    enabled: boolean;
    /**
     * Minimum password length enforced by better-auth.
     */
    minPasswordLength: number;
    /**
     * Maximum password length enforced by better-auth.
     */
    maxPasswordLength: number;
  };
  magicLink: {
    /**
     * Enable passwordless magic link sign-in.
     */
    enabled: boolean;
  };
  social: {
    /**
     * Enable social OAuth providers. Each provider also requires env credentials.
     */
    github: {
      enabled: boolean;
    };
  };
  accountLinking: {
    /**
     * Enable linking multiple auth providers to a single user.
     */
    enabled: boolean;
    /**
     * Allow linking accounts with different emails.
     */
    allowDifferentEmails: boolean;
    /**
     * Providers that are allowed to link without verified emails.
     */
    trustedProviders: string[];
    /**
     * Update user name/image when a new account is linked.
     */
    updateUserInfoOnLink: boolean;
    /**
     * Allow unlinking the last remaining account.
     */
    allowUnlinkingAll: boolean;
  };
};

export const AUTH_CONFIG: AuthConfig = {
  emailPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 35,
  },
  magicLink: {
    enabled: true,
  },
  social: {
    github: {
      enabled: true, // still requires github specific env vars
    },
  },
  accountLinking: {
    enabled: true,
    allowDifferentEmails: false,
    trustedProviders: [],
    updateUserInfoOnLink: false,
    allowUnlinkingAll: false,
  },
} as const;
