// Extended user type with custom fields
export type ExtendedUser = {
  id: string;
  email: string;
  name: string;
  username?: string | null;
  displayUsername?: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
};

export type ExtendedSession = {
  user: ExtendedUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};

// Helper to safely cast session user to extended type
export function getExtendedUser(user: unknown): ExtendedUser {
  return user as ExtendedUser;
}
