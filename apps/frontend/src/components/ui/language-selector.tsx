"use client";

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

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);

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
        {languages.map((language) => {
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
