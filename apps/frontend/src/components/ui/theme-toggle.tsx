import { CheckIcon, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/providers/theme";

enum Themes {
  Light = "light",
  Dark = "dark",
  System = "system",
}

const THEME_OPTIONS = [
  {
    label: "Light",
    value: Themes.Light,
  },
  {
    label: "Dark",
    value: Themes.Dark,
  },
  {
    label: "System",
    value: Themes.System,
  },
];

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  console.log("theme", theme);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_OPTIONS.map((themeOption) => {
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
            >
              <div className="flex justify-between w-full items-center">
                {themeOption.label}
                {themeOption.value === theme && <CheckIcon className="w-4 h-4" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
