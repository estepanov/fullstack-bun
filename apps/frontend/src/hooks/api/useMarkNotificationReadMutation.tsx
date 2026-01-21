import { apiClient } from "@frontend/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";

import {
  GET_NOTIFICATIONS_QUERY_KEY,
  GET_UNREAD_COUNT_QUERY_KEY,
  GET_NOTIFICATION_COUNTS_QUERY_KEY,
} from "./query-key";

const $patch = apiClient.notification[":id"].read.$patch;

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    InferResponseType<typeof $patch>,
    Error,
    { id: string; read: boolean }
  >({
    mutationFn: async ({ id, read }) => {
      const res = await $patch({
        param: { id },
        json: { read },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("Failed to update notification");
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate notifications and unread count queries
      queryClient.invalidateQueries({ queryKey: [GET_NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [GET_UNREAD_COUNT_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [GET_NOTIFICATION_COUNTS_QUERY_KEY] });
    },
  });
};
