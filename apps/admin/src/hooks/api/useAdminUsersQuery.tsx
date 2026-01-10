import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { ADMIN_USERS_GET_QUERY_KEY } from "./query-key";

interface UseAdminUsersQueryParams {
  page?: number;
  limit?: number;
}

export const useAdminUsersQuery = (params?: UseAdminUsersQueryParams) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;

  return useQuery({
    queryKey: [ADMIN_USERS_GET_QUERY_KEY, page, limit],
    queryFn: async () => {
      const response = await apiClient.admin.users.$get({
        query: {
          page: String(page),
          limit: String(limit),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      return data;
    },
  });
};
