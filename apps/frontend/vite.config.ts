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
      appType: "custom",
      server: {
        warmup: {
          clientFiles: [
            "src/root.tsx",
            "src/routes.ts",
            "src/pages/**/*.tsx",
            "src/entry.client.tsx",
          ],
        },
        host: "0.0.0.0",
        port: 5173,
        strictPort: false,
        hmr: {
          host: "localhost",
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
      // optimizeDeps: {
      //   include: ["react", "react-dom"],
      //   esbuildOptions: {
      //     mainFields: ["module", "main"],
      //     conditions: ["import", "module"],
      //   },
      // },
      // ssr: {
      //   noExternal: ["react-router"],
      // },
      resolve: {
        conditions: ["browser", "import"],
        dedupe: ["react", "react-dom", "react-router"],
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
    resolve: {
      conditions: ["browser", "import"],
      dedupe: ["react", "react-dom", "react-router"],
    },
    build: {
      minify: true,
      cssMinify: true,
    },
  };
});
