import {
  Container,
  ModeToggle,
  StyledLink,
  type ModeToggleCopy,
} from "frontend-common/components/ui";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./ui/language-selector";

export const Footer = () => {
  const { t } = useTranslation("footer");
  const { t: tColorMode } = useTranslation("color_mode_toggle");
  const modeToggleCopy: ModeToggleCopy = {
    label: tColorMode("label"),
    currentModeLabel: tColorMode("current_mode"),
    options: {
      light: tColorMode("options.light"),
      dark: tColorMode("options.dark"),
      system: tColorMode("options.system"),
    },
  };
  return (
    <footer className="py-4">
      <Container className="flex justify-between">
        <div className="flex items-center gap-2">
          <ModeToggle copy={modeToggleCopy} />
          <LanguageSelector />
        </div>
        <StyledLink to="/more" variant="muted">
          {t("links.second_page")}
        </StyledLink>
      </Container>
    </footer>
  );
};
