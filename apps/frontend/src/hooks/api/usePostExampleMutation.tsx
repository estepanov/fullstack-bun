import { apiClient } from "@/lib/api-client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { InferRequestType, InferResponseType } from 'hono'
import { EXAMPLE_GET_QUERY_KEY } from "./query-key"

const $post = apiClient.example.$post

export const usePostExampleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation<
    InferResponseType<typeof $post>,
    Error,
    InferRequestType<typeof $post>['json']
  >({
    mutationFn: async (inputData: { body: string }) => {
      const res = await $post({
        json: inputData,
      })
      return await res.json()
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: [EXAMPLE_GET_QUERY_KEY] })
    },
    onError: (error) => {
      console.log(error)
    },
  })
}