import { LANGUAGES, type Language } from "@/app.config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function LanguageSelector() {
  const { i18n } = useTranslation();
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
          className="flex items-center flex-shrink-0 gap-2 h-9 px-2 md:px-3"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline-flex">{currentLanguage.name}</span>
          <span className="inline-flex md:hidden">{currentLanguage.flag}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
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
}
