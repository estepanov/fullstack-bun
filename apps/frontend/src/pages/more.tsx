import { Container } from "frontend-common/components/ui";
import { Link } from "frontend-common/components/ui";
import { useTranslation } from "react-i18next";
const MorePage = () => {
  const { t } = useTranslation("second_page");
  return (
    <Container className="space-y-2 mt-4">
      <h1 className="text-2xl font-bold">{t("heading")}</h1>
      <div>{t("description")}</div>
      <Link to="/">{t("back_to_landing_page")}</Link>
    </Container>
  );
};

export default MorePage;
