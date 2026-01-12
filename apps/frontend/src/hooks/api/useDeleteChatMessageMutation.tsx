import { apiClient } from "@frontend/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import type { InferResponseType } from "hono";

const $delete = apiClient.chat.messages[":id"].$delete;

export const useDeleteChatMessageMutation = () => {
  return useMutation<InferResponseType<typeof $delete>, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const res = await $delete({ param: { id } });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("Failed to delete message");
      }

      return data;
    },
  });
};
