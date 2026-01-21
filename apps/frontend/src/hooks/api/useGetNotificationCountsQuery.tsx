import { GET_NOTIFICATION_COUNTS_QUERY_KEY } from "@frontend/hooks/api/query-key";
import { apiClient } from "@frontend/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { NotificationType } from "shared/interfaces/notification";

type NotificationCountsResponse = {
  success: boolean;
  counts: {
    byStatus: {
      all: number;
      read: number;
      unread: number;
    };
    byType: Record<NotificationType, number>;
  };
};

export const useGetNotificationCountsQuery = () => {
  return useQuery({
    queryKey: [GET_NOTIFICATION_COUNTS_QUERY_KEY],
    queryFn: async () => {
      const response = await apiClient.notification.counts.$get();
      if (!response.ok) {
        throw new Error("Failed to fetch notification counts");
      }
      return (await response.json()) as NotificationCountsResponse;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
};
