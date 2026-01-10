import { DocsContainer } from "@storybook/addon-docs/blocks";
import type { Preview } from "@storybook/react";
import { ThemeProvider } from "frontend-common/providers";
import type React from "react";
import { useEffect } from "react";
import { themes } from "storybook/theming";
import "./preview.css";

const resolveTheme = (context: { globals?: Record<string, unknown> }) => {
  const fromGlobals = context.globals?.theme;
  if (typeof fromGlobals === "string") {
    return fromGlobals;
  }

  if (typeof window === "undefined") {
    return "light";
  }

  const params = new URLSearchParams(window.location.search);
  const globals = params.get("globals") || "";
  const match = globals.match(/theme:(\w+)/);
  return match?.[1] || "light";
};

const ThemedDocsContainer = (props: React.ComponentProps<typeof DocsContainer>) => {
  const theme = resolveTheme(props.context ?? {});
  const docsTheme = theme === "dark" ? themes.dark : themes.light;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
  }, [theme]);

  return (
    <ThemeProvider
      key={`docs-${theme}`}
      defaultTheme={theme as "light" | "dark"}
      storageKey={`storybook-theme-${theme}`}
    >
      <div
        className={theme === "dark" ? "dark" : undefined}
        style={{
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
          minHeight: "100vh",
        }}
      >
        <DocsContainer {...props} context={props.context} theme={docsTheme} />
      </div>
    </ThemeProvider>
  );
};

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
      container: ThemedDocsContainer,
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
