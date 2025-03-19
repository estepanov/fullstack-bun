import { useState } from 'react'
import { useGetExampleQuery } from './hooks/api/useGetExampleQuery'
import { usePostExampleMutation } from './hooks/api/usePostExampleMutation'
function App() {
  const [count, setCount] = useState(0)
  const exampleGetQuery = useGetExampleQuery()
  const examplePostMutation = usePostExampleMutation()

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
