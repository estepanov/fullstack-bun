import { apiClient } from "@frontend/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import type { UpdatePreferencesRequest } from "shared/interfaces/notification";

import { GET_NOTIFICATION_PREFERENCES_QUERY_KEY } from "./query-key";

const $patch = apiClient.notification.preferences.$patch;

export const useUpdateNotificationPreferencesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<InferResponseType<typeof $patch>, Error, UpdatePreferencesRequest>({
    mutationFn: async (preferences) => {
      const res = await $patch({
        json: preferences,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("Failed to update preferences");
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate preferences query
      queryClient.invalidateQueries({
        queryKey: [GET_NOTIFICATION_PREFERENCES_QUERY_KEY],
      });
    },
  });
};
