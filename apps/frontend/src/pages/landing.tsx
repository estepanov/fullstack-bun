import { MessagesContainer } from "@/components/messages/messages-container";
import { useChatWebSocket } from "@/hooks/api/useChatWebSocket";
import { Container } from "frontend-common/components/ui";
import { Trans, useTranslation } from "react-i18next";

const LandingPage = () => {
  const { t: tLanding } = useTranslation("landing_page");
  const {
    messages,
    sendMessage,
    connectionStatus,
    error,
    isAuthenticated,
    throttle,
    onlineCounts,
  } = useChatWebSocket();

  const stats = [
    {
      label: tLanding("online_guests"),
      value: onlineCounts?.guests ?? "-",
    },
    {
      label: tLanding("online_members"),
      value: onlineCounts?.members ?? "-",
    },
    {
      label: tLanding("online_admins"),
      value: onlineCounts?.admins ?? "-",
    },
  ];

  return (
    <div className="app-surface">
      <Container className="space-y-6 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {tLanding("title")}
          </h1>
          <p className="text-muted-foreground">{tLanding("description")}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          <Trans
            i18nKey="get_started"
            t={tLanding}
            components={{
              code: (
                <code className="rounded bg-muted/70 px-2 py-1 text-xs text-foreground" />
              ),
            }}
          />
        </p>
        <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {tLanding("online_counts")}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3"
              >
                <div className="text-2xl font-semibold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <MessagesContainer
          messages={messages}
          sendMessage={sendMessage}
          connectionStatus={connectionStatus}
          error={error}
          isAuthenticated={isAuthenticated}
          throttle={throttle}
        />
      </Container>
    </div>
  );
};

export default LandingPage;
