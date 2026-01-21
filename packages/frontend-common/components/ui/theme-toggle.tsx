import { CheckIcon, Moon, Sun } from "lucide-react";
import { useTheme } from "../../providers/theme";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

enum Themes {
  Light = "light",
  Dark = "dark",
  System = "system",
}

export interface ModeToggleCopy {
  label: string;
  currentModeLabel: string;
  options: {
    light: string;
    dark: string;
    system: string;
  };
}

const THEME_OPTIONS = [
  {
    value: Themes.Light,
    key: "light",
  },
  {
    value: Themes.Dark,
    key: "dark",
  },
  {
    value: Themes.System,
    key: "system",
  },
  // Explicitly type the keys so TypeScript knows they align to the options shape
] as const satisfies ReadonlyArray<{
  value: Themes;
  key: keyof ModeToggleCopy["options"];
}>;

export const ModeToggle = ({ copy }: { copy: ModeToggleCopy }) => {
  const { setTheme, theme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{copy.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {THEME_OPTIONS.map((themeOption) => {
          const label = copy.options[themeOption.key];
          return (
            <DropdownMenuItem
              key={themeOption.value}
              className="cursor-pointer"
              onClick={() => setTheme(themeOption.value)}
            >
              <div className="flex justify-between items-center w-full">
                {label}
                {themeOption.value === theme && (
                  <CheckIcon aria-label={copy.currentModeLabel} className="w-4 h-4" />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
