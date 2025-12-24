import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { ADMIN_USERS_GET_QUERY_KEY } from "./query-key";

export const useAdminUsersQuery = () => {
  return useQuery({
    queryKey: [ADMIN_USERS_GET_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
        query: {},
      });
      if (error) throw error;
      return { users: data.users };
    },
  });
};
