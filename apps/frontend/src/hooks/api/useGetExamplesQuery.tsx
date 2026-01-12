import { apiClient } from "@frontend/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { Example } from "shared/interfaces/example";
import { EXAMPLE_GET_QUERY_KEY } from "./query-key";

interface ExampleResponse {
  list: Example[];
}

export const useGetExamplesQuery = () => {
  return useQuery<ExampleResponse>({
    queryKey: [EXAMPLE_GET_QUERY_KEY],
    queryFn: async () => {
      const res = await apiClient.example.$get({});
      const json = await res.json();
      if (Array.isArray(json?.list)) {
        return { list: json.list as Example[] };
      }
      return { list: [] };
    },
    initialData: { list: [] },
  });
};
