import { Button } from '@/components/ui/button'
import { useGetExampleQuery } from './hooks/api/useGetExampleQuery'
import { usePostExampleMutation } from './hooks/api/usePostExampleMutation'
import { ModeToggle } from './components/ui/theme-toggle'
import { RefreshCwIcon } from 'lucide-react'

function App() {
  const exampleGetQuery = useGetExampleQuery()
  const examplePostMutation = usePostExampleMutation()

  return (
    <>
      <div className="p-4 space-y-3">

        <Button variant="default" onClick={() => {
          examplePostMutation.mutate({ body: `hello ${(new Date()).toLocaleTimeString()}` })
        }}>
          add messages
        </Button>
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

      </div>
      <div className='flex flex-row space-x-3 p-4'>
        <Button 
          variant="outline"
          disabled={exampleGetQuery.isFetching || exampleGetQuery.isLoading}
          onClick={() => {
            exampleGetQuery.refetch()
          }}>
          <RefreshCwIcon className={(exampleGetQuery.isFetching || exampleGetQuery.isLoading) ? 'animate-spin' : ''} /> refresh
        </Button>
        <ModeToggle />
      </div>
    </>
  )
}

export default App
