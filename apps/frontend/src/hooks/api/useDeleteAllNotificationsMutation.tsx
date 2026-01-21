import { apiClient } from "@frontend/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";

import {
  GET_NOTIFICATIONS_QUERY_KEY,
  GET_UNREAD_COUNT_QUERY_KEY,
  GET_NOTIFICATION_COUNTS_QUERY_KEY,
} from "./query-key";

const $delete = apiClient.notification["delete-all"].$delete;

export const useDeleteAllNotificationsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<InferResponseType<typeof $delete>, Error, void>({
    mutationFn: async () => {
      const res = await $delete({});
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("Failed to delete all notifications");
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
