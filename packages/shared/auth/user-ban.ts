import { z } from "zod";

export const banUserSchema = z.object({
  reason: z.string().optional(),
  deleteMessages: z.boolean().default(false),
});

export type BanUserInput = z.infer<typeof banUserSchema>;

export const getBannedUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["bannedAt", "name", "email"]).default("bannedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type GetBannedUsersInput = z.infer<typeof getBannedUsersSchema>;
