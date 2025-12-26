import { Link } from "frontend-common/components/ui";
import { useTranslation } from "react-i18next";

const CatchAll = () => {
  const { t } = useTranslation("catchall");

  return (
    <div className="app-surface flex-1 flex flex-col justify-center items-center space-y-4">
      <h1 className="text-2xl font-bold text-center">{t("title")}</h1>
      <p className="text-muted-foreground text-center">
        {t("message")}
      </p>
      <Link to="/">{t("back_link")}</Link>
    </div>
  );
};

export default CatchAll;
