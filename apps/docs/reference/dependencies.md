---
layout: doc
---

# Dependencies

You can find all heavily used dependencies we rely on here, along with the major version we are currently using, and a link to the tools documentation.

Versions below are the majors currently used in this repo. Patch and minor versions move with `bun install`; see each workspace `package.json` for the exact range.

## Frontend & Admin-Frontend

| Dependency                                                    | Maj. Version  |
| ------------------------------------------------------------- | ------------- |
| [React](https://react.dev)                                    | 19            |
| [Vite](https://vite.dev)                                      | 8             |
| [React Router](https://reactrouter.com)                       | 8             |
| [Zod](https://zod.dev)                                        | 4             |
| [TanStack Forms](https://tanstack.com/form/latest)            | 1             |
| [TanStack Query](https://tanstack.com/query/latest)           | 5             |
| [Tailwindcss](https://tailwindcss.com)                        | 4             |
| [Pino](https://getpino.io)                                    | 10            |
| [i18next](https://www.i18next.com)                            | 26            |
| [react-i18next](https://react.i18next.com)                    | 17            |
| [MSW](https://mswjs.io)                                       | 2             |
| [Lucide](https://lucide.dev)                                  | 1             |
| [biomejs](https://biomejs.dev)                                | 2             |
| [TypeScript](https://www.typescriptlang.org)                  | 5             |


## API

| Dependency                                                    | Maj. Version  |
| ------------------------------------------------------------- | ------------- |
| [Hono](https://hono.dev)                                      | 4             |
| [Zod](https://zod.dev)                                        | 4             |
| [Pino](https://getpino.io)                                    | 10            |
| [UUID](https://github.com/uuidjs/uuid)                        | 14            |
| [better-auth](https://www.better-auth.com)                    | 1             |
| [Drizzle ORM](https://orm.drizzle.team)                       | 0             |
| [ioredis](https://github.com/redis/ioredis)                   | 6             |
| [Nodemailer](https://nodemailer.com)                          | 10            |
| [biomejs](https://biomejs.dev)                                | 2             |
| [TypeScript](https://www.typescriptlang.org)                  | 5             |


## Docs & Storybook

| Dependency                                                    | Maj. Version  |
| ------------------------------------------------------------- | ------------- |
| [VitePress](https://vitepress.dev)                            | 1             |
| [Storybook](https://storybook.js.org)                         | 10            |
| [Vitest](https://vitest.dev)                                  | 5             |


## Notes

- **TypeScript** stays on 5.9. TypeScript 7 is the latest compiler release, but 7.0 does not yet expose a stable programmatic API for surrounding tooling, so this repo uses the latest 5.x that the current Vite / React Router / Biome stack supports cleanly.
- **Drizzle ORM** uses the latest stable `0.45` line with matching `drizzle-kit` `0.31`. Drizzle 1.0 is still a release candidate and is not used here.
- **Lucide 1** removed brand icons (GitHub, Figma, and similar). Use a generic Lucide icon or a dedicated brand-icon set if a logo is required.
- **ioredis 6** defaults to RESP3. This repo sets `protocol: 2` on the Redis client so sorted-set members stay strings, matching the previous ioredis 5 behavior.
- **better-auth 1.7** `unlinkAccount` takes the local account row `id` from `listAccounts()` as `accountId`. Do not pass `providerId` or the provider-side account identifier.
