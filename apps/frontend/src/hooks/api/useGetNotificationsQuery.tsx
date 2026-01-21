import { apiClient } from "@frontend/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { ListNotificationsQuery } from "shared/interfaces/notification";

import { GET_NOTIFICATIONS_QUERY_KEY } from "./query-key";

export const useGetNotificationsQuery = (params: ListNotificationsQuery) => {
  return useQuery({
    queryKey: [GET_NOTIFICATIONS_QUERY_KEY, params],
    queryFn: async () => {
      const res = await apiClient.notification.list.$get({
        query: {
          page: params.page,
          limit: params.limit,
          filter: params.filter,
          type: params.type,
          search: params.search,
        },
      });
      const json = await res.json();
      return json;
    },
  });
};
