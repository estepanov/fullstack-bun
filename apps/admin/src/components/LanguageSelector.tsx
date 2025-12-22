import { LANGUAGES, type Language } from "@/app.config";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "frontend-common/components/ui";
import { Check, Globe } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation("common");
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    LANGUAGES.find((language) => language.code === i18n.resolvedLanguage) || LANGUAGES[0],
  );

  const changeLanguage = (language: Language) => {
    i18n.changeLanguage(language.code);
    setCurrentLanguage(language);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("language", "Language")}
          title={t("language", "Language")}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t("language", "Language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {LANGUAGES.map((language) => {
          const isActive = currentLanguage.code === language.code;
          return (
            <DropdownMenuItem
              key={language.code}
              asChild
              className={isActive ? "bg-muted" : ""}
            >
              <Button
                variant="ghost"
                className="flex items-center justify-between"
                onClick={() => changeLanguage(language)}
              >
                <span className="flex items-center gap-2">
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                </span>
                {isActive && <Check className="h-4 w-4" />}
              </Button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
