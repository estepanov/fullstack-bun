import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { copyTranslationsPlugin } from "./src/lib/vite-i18n-plugin";

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  if (command === "serve") {
    return {
      plugins: [tsconfigPaths(), reactRouter(), tailwindcss()],
      server: {
        host: "0.0.0.0",
        port: 5173,
        strictPort: false,
        hmr: {
          host: "0.0.0.0",
          port: 5174,
          clientPort: 5174,
        },
        watch: {
          usePolling: true,
          interval: 200,
          ignored: [
            "**/.git/**",
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/.dockerignore/**",
            "**/.env.example/**",
            "**/.env/**",
            "**/README.md/**",
          ],
        },
      },
      optimizeDeps: {
        include: ["react", "react-dom"],
      },
    };
  }

  return {
    plugins: [
      tsconfigPaths(),
      reactRouter(),
      tailwindcss(),
      copyTranslationsPlugin({
        localesDir: "locales",
      }),
    ],
    build: {
      minify: true,
      cssMinify: true,
    },
  };
});
