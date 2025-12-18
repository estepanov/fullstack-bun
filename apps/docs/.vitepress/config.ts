import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  head: [["link", { rel: "icon", href: "/favicon.png" }]],
  lastUpdated: true,
  title: "Fullstack-Bun Docs",
  description:
    "The documentation site for estepanov/fullstack-bun boilerplate. API powered by Hono. With static React + Vite frontend. Shadcn and TailwindCSS 4 for styling.",
  themeConfig: {
    logo: {
      light: "/es-logo.svg",
      dark: "/es-logo-light.svg",
      alt: "Evans Stepanov logo",
    },
    search: {
      provider: "local",
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Get Started", link: "/get-started" },
      { text: "Reference", link: "/reference" },
      { text: "Docker", link: "/docker" },
    ],

    sidebar: {
      "/get-started/": [
        {
          text: "Get Started",
          items: [{ text: "Intro", link: "/get-started/index.html" }],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [
            { text: "Overview", link: "/reference/index.html" },
            { text: "Dependencies", link: "/reference/dependencies.html" },
            { text: "Database", link: "/reference/database.html" },
            { text: "Redis", link: "/reference/redis.html" },
            {
              text: "Environment Variables",
              link: "/reference/environment-variables.html",
            },
            {
              text: "Internationalization",
              link: "/reference/internationalization.html",
            },
            { text: "Forms", link: "/reference/forms.html" },
            {
              text: "Routing",
              items: [
                { text: "Frontend Routing", link: "/reference/frontend-routing.html" },
                { text: "API Routing", link: "/reference/api-routing.html" },
              ],
            },
            {
              text: "Testing",
              items: [
                { text: "Frontend Testing", link: "/reference/frontend-testing.html" },
              ],
            },
            { text: "Docker", link: "/docker.html" },
          ],
        },
      ],
    },
    editLink: {
      pattern: "https://github.com/estepanov/fullstack-bun/apps/docs/:path",
    },
    socialLinks: [
      { icon: "buymeacoffee", link: "https://www.buymeacoffee.com/estepanov" },
      { icon: "github", link: "https://github.com/estepanov/fullstack-bun" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright:
        'Copyright © 2025 <a href="https://evansstepanov.com/?utm_source=fullstack-bun-docs">Evans Stepanov</a>',
    },
  },
  ignoreDeadLinks: [
    // ignore all localhost links
    /^https?:\/\/localhost/,
  ],
});
