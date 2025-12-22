import { UserRole, userRoleSchema } from "shared/auth/user-role";

export const getSessionUserRole = (session: unknown) => {
  if (!session || typeof session !== "object") return null;
  const user = (session as { user?: unknown }).user;
  if (!user || typeof user !== "object") return null;

  const parsed = userRoleSchema.safeParse((user as { role?: unknown }).role);
  return parsed.success ? parsed.data : null;
};

export const isAdminSession = (session: unknown) =>
  getSessionUserRole(session) === UserRole.ADMIN;
