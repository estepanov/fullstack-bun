import { useTranslation } from "react-i18next";

export default function CatchAll() {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">
          {t("page_not_found", "Page not found")}
        </p>
      </div>
    </div>
  );
}
