import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  addons: ["@storybook/addon-docs"],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  core: {
    disableTelemetry: true,
  },

  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },

  docs: {},

  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    const tailwindcss = await import("@tailwindcss/vite");

    return mergeConfig(config, {
      plugins: [tailwindcss.default()],
      resolve: {
        alias: {
          "frontend-common": join(__dirname, "../../..", "packages/frontend-common"),
        },
      },
    });
  },
};

export default config;
