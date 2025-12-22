import { apiClient } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { ADMIN_USERS_GET_QUERY_KEY, ADMIN_BANS_GET_QUERY_KEY } from "./query-key";

const $post = apiClient.admin.users[":id"].unban.$post;

export const useUnbanUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<InferResponseType<typeof $post>, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const res = await $post({
        param: { id },
      });
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_GET_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [ADMIN_BANS_GET_QUERY_KEY] });
    },
  });
};
