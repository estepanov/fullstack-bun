import { Container } from "frontend-common/components/ui";
import { Link } from "frontend-common/components/ui";
import { useTranslation } from "react-i18next";
const MorePage = () => {
  const { t } = useTranslation("second_page");
  return (
    <div className="app-surface">
      <Container className="space-y-4 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t("heading")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80"
        >
          {t("back_to_landing_page")}
        </Link>
      </Container>
    </div>
  );
};

export default MorePage;
