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
    <Container className="space-y-2 mt-4">
      <h1 className="text-2xl font-bold">{tLanding("title")}</h1>
      <p className="text-muted-foreground">{tLanding("description")}</p>
      <p>
        <Trans
          i18nKey="get_started"
          t={tLanding}
          components={{ code: <code className="break-all" /> }}
        />
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {tLanding("online_counts")}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800/70 dark:bg-slate-900/80"
            >
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
  );
};

export default LandingPage;
