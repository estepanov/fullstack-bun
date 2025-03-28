import { Button } from '@/components/ui/button'
import { useGetExampleQuery } from './hooks/api/useGetExampleQuery'
import { usePostExampleMutation } from './hooks/api/usePostExampleMutation'
import { ModeToggle } from './components/ui/theme-toggle'
import { RefreshCwIcon } from 'lucide-react'
import { Input } from './components/ui/input'

function App() {
  const exampleGetQuery = useGetExampleQuery()
  const examplePostMutation = usePostExampleMutation()

  return (
    <>
      <form className='flex flex-row space-x-3 p-4'>
        <Input />
        <Button variant="default" onClick={() => {
          examplePostMutation.mutate({ body: `new message posted ${(new Date()).toLocaleTimeString()}` })
        }}>
          add messages
        </Button>
      </form>
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

      <div className="p-4 space-y-3">
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR and&nbsp;
          <span className="text-muted bg-muted-foreground inline-block p-1 rounded">
            Have fun out there!
          </span>
        </p>
        {exampleGetQuery?.data && <ul>
          {exampleGetQuery.data.list.map((item) => (
            <li className="py-1 px-2 m-1 border rounded" key={item.id}>
              <span className='text-muted-foreground text-xs font-mono block'>{new Date(item.postedAt).toLocaleTimeString()}</span>
              {item.body}
            </li>
          ))}
        </ul>}

      </div>

    </>
  )
}

export default App
