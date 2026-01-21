import { apiClient } from "@frontend/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";

import {
  GET_NOTIFICATIONS_QUERY_KEY,
  GET_UNREAD_COUNT_QUERY_KEY,
  GET_NOTIFICATION_COUNTS_QUERY_KEY,
} from "./query-key";

const $patch = apiClient.notification["mark-all-read"].$patch;

export const useMarkAllReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<InferResponseType<typeof $patch>, Error, void>({
    mutationFn: async () => {
      const res = await $patch({});
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("Failed to mark all as read");
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
