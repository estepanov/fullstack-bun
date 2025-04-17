import { MessagesContainer } from "@/components/messages/messages-container";
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
      <p>
        Edit <code>src/App.tsx</code> and save to test HMR and&nbsp;
        <span className="text-muted bg-muted-foreground inline-block p-1 rounded font-mono">
          Have fun out there!
        </span>
      </p>
      <MessagesContainer />
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
    </Container>
  );
};

export default LandingPage;
