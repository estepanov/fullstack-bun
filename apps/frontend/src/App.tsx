import { Button } from '@/components/ui/button'
import { useGetExampleQuery } from './hooks/api/useGetExampleQuery'
import { ModeToggle } from './components/ui/theme-toggle'
import { RefreshCwIcon } from 'lucide-react'
import { MessageForm } from './components/message-form'

function App() {
  const exampleGetQuery = useGetExampleQuery()

  return (
    <>
      <MessageForm />
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
              {item.message}
            </li>
          ))}
        </ul>}

      </div>

    </>
  )
}

export default App
