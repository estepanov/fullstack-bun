import { MessageForm } from "@/components/message-form";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useGetExampleQuery } from "@/hooks/api/useGetExampleQuery";
import { RefreshCwIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
const LandingPage = () => {
  const exampleGetQuery = useGetExampleQuery();
  const { t } = useTranslation("landing_page");

  return (
    <Container className="space-y-2 mt-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <MessageForm />
      <div className="flex flex-row space-x-3">
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
      </div>
      <div className="space-y-3">
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR and&nbsp;
          <span className="text-muted bg-muted-foreground inline-block p-1 rounded font-mono">
            Have fun out there!
          </span>
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
    </Container>
  );
};

export default LandingPage;
