import { apiClient } from "@frontend/lib/api-client";
import { useQuery } from "@tanstack/react-query";

import { GET_NOTIFICATION_PREFERENCES_QUERY_KEY } from "./query-key";

export const useGetNotificationPreferencesQuery = () => {
  return useQuery({
    queryKey: [GET_NOTIFICATION_PREFERENCES_QUERY_KEY],
    queryFn: async () => {
      const res = await apiClient.notification.preferences.$get({});
      const json = await res.json();
      return json;
    },
  });
};
