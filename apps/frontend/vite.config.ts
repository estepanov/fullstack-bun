import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  if (command === "serve") {
    return {
      server: { port: process.env.DEV_PORT ? Number(process.env.DEV_PORT) : 3000 },
      plugins: [reactRouter(), tailwindcss()],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
          "@test": path.resolve(__dirname, "./test"),
          "@locales": path.resolve(__dirname, "./locales"),
        },
      },
    };
  }

  return {
    plugins: [reactRouter(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@test": path.resolve(__dirname, "./test"),
        "@locales": path.resolve(__dirname, "./locales"),
      },
    },
    build: {
      minify: true,
      cssMinify: true,
    },
  };
});
