import { apiClient } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import type { BanUserInput } from "shared/auth/user-ban";
import { ADMIN_USERS_GET_QUERY_KEY, ADMIN_BANS_GET_QUERY_KEY } from "./query-key";

const $post = apiClient.admin.users[":id"].ban.$post;

export const useBanUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    InferResponseType<typeof $post>,
    Error,
    { id: string; data: BanUserInput }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await $post({
        param: { id },
        json: data,
      });
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_GET_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: [ADMIN_BANS_GET_QUERY_KEY] });
    },
  });
};
