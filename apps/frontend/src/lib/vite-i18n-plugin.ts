import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin } from "vite";

export interface I18nPluginOptions {
  localesDir?: string;
  publicPath?: string;
}

export function i18nPlugin(options: I18nPluginOptions = {}): Plugin {
  const { localesDir = "locales", publicPath = "/locales" } = options;

  return {
    name: "vite-i18n-dev-server",
    configureServer(server) {
      // Use a more specific middleware registration with explicit path matching
      server.middlewares.use(publicPath, (req, res, _next) => {
        // Handle CORS for i18n requests
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }

        if (!req.url) {
          res.statusCode = 400;
          res.end("Bad Request");
          return;
        }

        try {
          // Parse the URL to extract language and namespace
          // req.url at this point should be the path after /locales
          // Expected format: /{language}/{namespace}.json
          const urlParts = req.url.split("/").filter(Boolean);

          if (urlParts.length !== 2) {
            res.statusCode = 404;
            res.end("Not Found");
            return;
          }

          const [language, namespaceWithExt] = urlParts;

          if (!namespaceWithExt.endsWith(".json")) {
            res.statusCode = 404;
            res.end("Not Found");
            return;
          }

          const namespace = namespaceWithExt.replace(".json", "");

          // Resolve the file path - handle both development and Docker paths
          const basePath = process.cwd();
          const fullLocalesPath = resolve(basePath, localesDir);
          const filePath = resolve(fullLocalesPath, language, `${namespace}.json`);

          if (!existsSync(filePath)) {
            res.statusCode = 404;
            res.end(`Translation file not found: ${language}/${namespace}.json`);
            return;
          }

          // Read and serve the translation file
          const content = readFileSync(filePath, "utf-8");

          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache");
          res.statusCode = 200;
          res.end(content);
        } catch (error) {
          console.error("Error serving translation file:", error);
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      });
    },
  };
}

export function copyTranslationsPlugin(options: I18nPluginOptions = {}): Plugin {
  const { localesDir = "locales" } = options;

  return {
    name: "copy-translations",
    generateBundle() {
      if (!existsSync(localesDir)) {
        this.warn(`Locales directory "${localesDir}" not found`);
        return;
      }

      const languages = readdirSync(localesDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const lang of languages) {
        const langDir = join(localesDir, lang);
        const files = readdirSync(langDir).filter((file) => file.endsWith(".json"));

        for (const file of files) {
          const filePath = join(langDir, file);
          const content = readFileSync(filePath, "utf-8");

          this.emitFile({
            type: "asset",
            fileName: `locales/${lang}/${file}`,
            source: content,
          });
        }
      }
    },
  };
}
