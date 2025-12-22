import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { ADMIN_USERS_GET_QUERY_KEY } from "./query-key";

const $get = apiClient.admin.users.$get;

export const useAdminUsersQuery = () => {
  return useQuery<InferResponseType<typeof $get>>({
    queryKey: [ADMIN_USERS_GET_QUERY_KEY],
    queryFn: async () => {
      const res = await $get({});
      return await res.json();
    },
  });
};
