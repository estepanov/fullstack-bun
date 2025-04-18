import { MessagesContainer } from "@/components/messages/messages-container";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useGetExampleQuery } from "@/hooks/api/useGetExampleQuery";
import { RefreshCwIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
const LandingPage = () => {
  const exampleGetQuery = useGetExampleQuery();
  const { t } = useTranslation(["landing_page", "messages"]);

  return (
    <Container className="space-y-2 mt-4">
      <h1 className="text-2xl font-bold">{t("landing_page:title")}</h1>
      <p className="text-muted-foreground">{t("landing_page:description")}</p>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
      <p dangerouslySetInnerHTML={{ __html: t("landing_page:get_started") }} />
      <MessagesContainer />
      <div className="flex flex-row space-x-3">
        <Button
          variant="outline"
          disabled={exampleGetQuery.isFetching || exampleGetQuery.isLoading}
          onClick={() => {
            exampleGetQuery.refetch();
          }}
          className="flex flex-row items-center gap-x-2"
        >
          <RefreshCwIcon
            className={
              exampleGetQuery.isFetching || exampleGetQuery.isLoading
                ? "animate-spin"
                : ""
            }
          />
          {t("messages:actions.refresh_button")}
        </Button>
      </div>
    </Container>
  );
};

export default LandingPage;
