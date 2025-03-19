import { apiClient } from "@/lib/api-client"
import { useQuery } from "@tanstack/react-query"

export const EXAMPLE_GET_QUERY_KEY = 'example-get'

export const useGetExampleQuery= () => {
    return useQuery({
        queryKey: [EXAMPLE_GET_QUERY_KEY],
        queryFn: async () => {
          const res = await apiClient.example.$get({})
          return await res.json()
        },
      })
}