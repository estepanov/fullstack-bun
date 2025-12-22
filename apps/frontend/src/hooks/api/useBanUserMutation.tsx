import { apiClient } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import type { BanUserInput } from "shared/auth/user-ban";

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
      // Invalidate any relevant queries after banning a user
      await queryClient.invalidateQueries();
    },
  });
};
