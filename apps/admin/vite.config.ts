import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { copyTranslationsPlugin } from "./src/lib/vite-i18n-plugin";

const adminDir = dirname(fileURLToPath(import.meta.url));

const applyDemoEnvFromFile = () => {
  if (process.env.VITE_ADMIN_DEMO !== "true") {
    return;
  }

  const envPath = resolve(adminDir, ".env.demo");
  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key) {
      // Demo builds must use .env.demo even if the host (e.g. Cloudflare Pages)
      // still has stale VITE_* values in the dashboard.
      process.env[key] = value;
    }
  }
};

applyDemoEnvFromFile();

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
        port: 5175,
        strictPort: false,
        hmr: {
          host: "0.0.0.0",
          port: 5176,
          clientPort: 5176,
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
        esbuildOptions: {
          mainFields: ["module", "main"],
          conditions: ["import", "module"],
        },
      },
      ssr: {
        noExternal: ["react-router"],
      },
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
