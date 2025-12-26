import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

import { GET_USER_PROFILE_QUERY_KEY } from "./query-key";

export const useGetUserProfileQuery = () => {
  return useQuery({
    queryKey: [GET_USER_PROFILE_QUERY_KEY],
    queryFn: async () => {
      const res = await apiClient.user.profile.$get({});
      const json = await res.json();
      return json;
    },
  });
};
