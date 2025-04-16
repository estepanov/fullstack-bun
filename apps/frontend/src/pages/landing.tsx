import { MessageForm } from "@/components/message-form";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { useGetExampleQuery } from "@/hooks/api/useGetExampleQuery";
import { RefreshCwIcon } from "lucide-react";

const LandingPage = () => {
  const exampleGetQuery = useGetExampleQuery();

  return (
    <>
      <MessageForm />
      <div className="flex flex-row space-x-3 p-4">
        <Button
          variant="outline"
          disabled={exampleGetQuery.isFetching || exampleGetQuery.isLoading}
          onClick={() => {
            exampleGetQuery.refetch();
          }}
        >
          <RefreshCwIcon
            className={
              exampleGetQuery.isFetching || exampleGetQuery.isLoading
                ? "animate-spin"
                : ""
            }
          />{" "}
          refresh
        </Button>
        <ModeToggle />
      </div>

      <div className="p-4 space-y-3">
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR and&nbsp;
          <span className="text-muted bg-muted-foreground inline-block p-1 rounded font-mono">
            Have fun out there!
          </span>
          <Link to="/more">See a new page</Link>
        </p>
        {exampleGetQuery?.data ? (
          <ul>
            {exampleGetQuery.data.list.map((item) => (
              <li className="py-1 px-2 m-1 border rounded" key={item.id}>
                <span className="text-muted-foreground text-xs font-mono block">
                  {new Date(item.postedAt).toLocaleTimeString()}
                </span>
                {item.message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
};

export default LandingPage;
