import { apiClient } from "@frontend/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import type { InferResponseType } from "hono";

const $patch = apiClient.chat.messages[":id"].$patch;

export const useUpdateChatMessageMutation = () => {
  return useMutation<
    InferResponseType<typeof $patch>,
    Error,
    { id: string; message: string }
  >({
    mutationFn: async ({ id, message }) => {
      const res = await $patch({
        param: { id },
        json: { message },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("Failed to update message");
      }

      return data;
    },
  });
};
