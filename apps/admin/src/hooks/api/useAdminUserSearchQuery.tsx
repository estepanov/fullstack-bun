import { apiClient } from "@admin/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { ADMIN_USERS_SEARCH_QUERY_KEY } from "./query-key";

interface UseAdminUserSearchQueryParams {
  query: string;
  limit?: number;
}

export const useAdminUserSearchQuery = ({
  query,
  limit = 20,
}: UseAdminUserSearchQueryParams) =>
  useQuery({
    queryKey: [ADMIN_USERS_SEARCH_QUERY_KEY, query, limit],
    queryFn: async () => {
      const response = await apiClient.admin.users.search.$get({
        query: {
          q: query,
          limit: String(limit),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      return response.json();
    },
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
