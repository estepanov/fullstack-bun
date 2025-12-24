import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { ADMIN_BANS_GET_QUERY_KEY } from "./query-key";

export const useBannedUsersQuery = () => {
  return useQuery({
    queryKey: [ADMIN_BANS_GET_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
        query: {},
      });
      if (error) throw error;

      const bannedUsers = data.users.filter((u) => u.banned);

      return {
        bans: bannedUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          banned: true,
          banReason: u.banReason,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        })),
      };
    },
  });
};
