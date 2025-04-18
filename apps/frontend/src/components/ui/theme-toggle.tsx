import { CheckIcon, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/providers/theme";
import { useTranslation } from "react-i18next";

enum Themes {
  Light = "light",
  Dark = "dark",
  System = "system",
}

const THEME_OPTIONS = [
  {
    label: "Light",
    value: Themes.Light,
    translationKey: "options.light",
  },
  {
    label: "Dark",
    value: Themes.Dark,
    translationKey: "options.dark",
  },
  {
    label: "System",
    value: Themes.System,
    translationKey: "options.system",
  },
];

export const ModeToggle = () => {
  const { t } = useTranslation("color_mode_toggle");
  const { setTheme, theme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t("label")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_OPTIONS.map((themeOption) => {
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className="cursor-pointer"
            >
              <div className="flex justify-between w-full items-center">
                {t(themeOption.translationKey)}
                {themeOption.value === theme && (
                  <CheckIcon aria-label={t("current_mode")} className="w-4 h-4" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
