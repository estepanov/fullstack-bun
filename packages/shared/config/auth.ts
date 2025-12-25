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
};

export const AUTH_CONFIG: AuthConfig = {
  emailPassword: {
    enabled: true,
  },
  magicLink: {
    enabled: true,
  },
  social: {
    github: {
      enabled: false,
    },
  },
} as const;
