import type { Preview } from "@storybook/react";
import { ThemeProvider } from "frontend-common/providers";
import { themes } from "storybook/theming";
import "./preview.css";
import React, { useEffect } from "react";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      sort: "alpha",
    },
    layout: "centered",
    backgrounds: {
      disable: true,
    },
    docs: {
      theme: themes.light,
    },
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "light";

      useEffect(() => {
        // Apply theme to root element for story previews (runs in iframe)
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        root.style.colorScheme = theme;
      }, [theme]);

      return (
        <ThemeProvider
          key={theme}
          defaultTheme={theme as "light" | "dark"}
          storageKey={`storybook-theme-${theme}`}
        >
          <Story />
        </ThemeProvider>
      );
    },
  ],

  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
