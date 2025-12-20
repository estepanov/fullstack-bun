import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { ADMIN_BANS_GET_QUERY_KEY } from "./query-key";

const $get = apiClient.admin.bans.$get;
type BannedUsersResponse = InferResponseType<typeof $get, 200>;

type BannedUsersQueryParams = {
  page?: number;
  limit?: number;
  sortBy?: "bannedAt" | "name" | "email";
  sortOrder?: "asc" | "desc";
};

export const useBannedUsersQuery = (params: BannedUsersQueryParams = {}) => {
  return useQuery<BannedUsersResponse>({
    queryKey: [ADMIN_BANS_GET_QUERY_KEY, params],
    queryFn: async () => {
      const res = await $get({
        query: {
          page: params.page?.toString(),
          limit: params.limit?.toString(),
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch banned users");
      }
      return await res.json();
    },
  });
};
