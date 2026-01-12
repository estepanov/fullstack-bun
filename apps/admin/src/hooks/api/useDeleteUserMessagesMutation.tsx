import { apiClient } from "@admin/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import type { InferResponseType } from "hono";

const $delete = apiClient.admin.users[":id"].messages.$delete;

export const useDeleteUserMessagesMutation = () => {
  return useMutation<InferResponseType<typeof $delete>, Error, { userId: string }>({
    mutationFn: async ({ userId }) => {
      const res = await $delete({
        param: { id: userId },
      });
      return await res.json();
    },
  });
};
