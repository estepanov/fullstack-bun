import { useTranslation } from "react-i18next";

export default function AdminDashboard() {
  const { t } = useTranslation("admin");

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 w-full">
      <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm shadow-black/5 backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t("dashboard.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("dashboard.welcome")}</p>
      </div>
    </div>
  );
}
