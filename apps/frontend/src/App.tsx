import { useState } from 'react'
import { apiClient } from './hooks/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { InferRequestType, InferResponseType } from 'hono'
function App() {
  const [count, setCount] = useState(0)
  const queryClient = useQueryClient()
  const exampleGetQuery = useQuery({
    queryKey: ['example-get'],
    queryFn: async () => {
      const res = await apiClient.example.$get({})
      return await res.json()
    },
  })

  const $post = apiClient.example.$post

  const examplePostMutation = useMutation<
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
      queryClient.invalidateQueries({ queryKey: ['example-get'] })
    },
    onError: (error) => {
      console.log(error)
    },
  })

  return (
    <>
      <div className="p-4 space-y-3">
        <button className='p-4 border' onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button onClick={() => {
          examplePostMutation.mutate({ body: `hello ${(new Date()).toLocaleTimeString()}` })
        }}>
          two
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <p className="text-muted bg-muted-foreground inline-block p-1">
          Have fun out there!
        </p>
        {exampleGetQuery?.data && <ul>
          {exampleGetQuery.data.list.map((item) => (
            <li key={item.id}>{item.body}</li>
          ))}
        </ul>}
        <button onClick={() => {
          exampleGetQuery.refetch()
        }}>
          refresh
        </button>
      </div>
    </>
  )
}

export default App
