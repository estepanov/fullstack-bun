import { Container } from "@/components/ui/container";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export const Footer = () => {
  const { t } = useTranslation("footer");
  return (
    <footer className="py-4">
      <Container className="flex justify-between">
        <ModeToggle />
        <Link to="/more">{t("links.second_page")}</Link>
      </Container>
    </footer>
  );
};
