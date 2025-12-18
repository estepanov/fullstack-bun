import { z } from "zod";

export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const userRoleSchema = z.enum([UserRole.USER, UserRole.ADMIN]);

export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const isAdmin = (role: UserRole) => role === UserRole.ADMIN;

