import { apiClient } from "@/lib/api-client"
import { useQuery } from "@tanstack/react-query"
import { EXAMPLE_GET_QUERY_KEY } from "./query-key"


export const useGetExampleQuery= () => {
    return useQuery({
        queryKey: [EXAMPLE_GET_QUERY_KEY],
        queryFn: async () => {
          const res = await apiClient.example.$get({})
          return await res.json()
        },
      })
}