import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { Example } from "shared/interfaces/example";
import { EXAMPLE_GET_QUERY_KEY } from "./query-key";

interface ExampleResponse {
  list: Example[];
}

export const useGetExampleQuery = () => {
  return useQuery<ExampleResponse>({
    queryKey: [EXAMPLE_GET_QUERY_KEY],
    queryFn: async () => {
      const res = await apiClient.example.$get({});
      return await res.json();
    },
  });
};
