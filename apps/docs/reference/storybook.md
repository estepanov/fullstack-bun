---
layout: doc
---

# Storybook

The Storybook app lives in `apps/storybook` and showcases the shared UI primitives from
`packages/frontend-common`. It uses the Vite-powered Storybook runtime and mirrors the
frontend theme setup so components render exactly as they do in the app.

## Run Storybook

From the repo root:

```bash
bun run storybook:dev
```

Storybook runs on `http://localhost:6006` by default.

Alternative (from anywhere in the repo):

```bash
bun --filter=storybook-app dev
```

### Build and preview

```bash
bun run storybook:build
bun run storybook:preview
```

The preview command serves the static output from `storybook-static`.

## Styling and theming

- Tailwind v4 is enabled in `.storybook/preview.css` and scans
  `packages/frontend-common` for utility classes.
- Shared theme variables come from `packages/frontend-common/styles/theme.css`.
- Theme switching (light/dark) is wired to the Storybook toolbar and applied to both
  the docs and iframe previews via `.storybook/preview.tsx` and
  `.storybook/preview-head.html`.

## Adding stories

- Place stories in `apps/storybook/src` using `*.stories.tsx` or `*.mdx`.
- Use components from `frontend-common` to keep UI primitives consistent.
- Keep stories focused on a single component or interaction state.

## Demo

A hosted demo is available at:

- https://storybook.demo.fullstackbun.dev
