import { Container } from "frontend-common/components/ui";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { LanguageSelector } from "./ui/language-selector";

export const Footer = () => {
  const { t } = useTranslation("footer");
  return (
    <footer className="py-4">
      <Container className="flex justify-between">
        <div className="flex items-center gap-2">
          <ModeToggle />
          <LanguageSelector />
        </div>
        <Link to="/more">{t("links.second_page")}</Link>
      </Container>
    </footer>
  );
};
