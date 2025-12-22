import { useTranslation } from "react-i18next";

export default function AdminDashboard() {
  const { t } = useTranslation("admin");

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground mb-4">
        {t("dashboard.title", "Admin Dashboard")}
      </h1>
      <p className="text-muted-foreground">
        {t("dashboard.welcome", "Welcome to the admin portal. Use the sidebar to navigate.")}
      </p>
    </div>
  );
}
