# Repository Guidelines
Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

## Project Structure & Module Organization
- Monorepo managed by Bun workspaces; app code lives in `apps/`, shared libraries in `packages/`.
- `apps/frontend`: React 19 + Vite + Tailwind 4; routes in `src/routes`, UI primitives in `src/components`, tests in `test`, static assets in `public`.
- `apps/api`: Hono API with Drizzle; handlers and schemas in `src`, database config in `drizzle/`, type build output in `dist/`.
- `apps/docs`: documentation site; Markdown in `apps/docs/reference` and `apps/docs/get-started`.
- `packages/shared`: cross-app interfaces and types consumed via workspace dependency `shared`.

## Build, Test, and Development Commands
- Always use `bun` and `bunx` instead of `npm` or `yarn` or `pnpm`
- Install deps once from the repo root: `bun install`.
- Set up env files: `bun run setup` (copies `.env.example` for API and frontend).
- Run both apps during development: `bun run dev` (concurrently runs API and frontend).
- Build for release: `bun run build` (API types + frontend bundle).
- Lint/format all packages: `bun run lint` / `bun run format`.
- Targeted scripts: `bun --filter=api dev`, `bun --filter=frontend test`, `bun --filter=docs dev`.
- Docker flows: `bun run docker:dev:build` (local) and `bun run docker:prod:build` (production image).

## Coding Style & Naming Conventions
- TypeScript + ESM everywhere; prefer `async`/`await` over promise chaining.
- Formatting enforced by Biome (2-space indent, 90-char lines, double quotes, organized imports). Always run `bun run format` before pushing.
- React components: PascalCase filenames; hooks/utilities: camelCase. Keep JSX in `tsx` files; colocate component styles/utilities nearby.
- API routes and validators should live with their handlers; share types via `packages/shared` to avoid drift.
- When building or refactoring shared components (especially in `packages/frontend-common`), update or add Storybook stories in `apps/storybook/src` to match the new API and behavior.
- Some component implementation expectations (example based on `packages/frontend-common/components/ui/button.tsx` and `button.variants.ts`):
  - Supports `variant`: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.
  - Supports `size`: `default`, `xs`, `sm`, `lg`, `icon`.
  - Supports `asChild` via Radix `Slot`, so stories should cover both standard and `asChild` rendering when applicable.
  - Uses `buttonVariants` for styling; story args should align with the defined variants and sizes.
  - `apps/storybook/src/Button.stories.tsx` should cover core states: variants, sizes, icon-only, icon+text, disabled, and loading.

## Testing Guidelines
- Primary runner is `bun test`; frontend uses Happy DOM and Testing Library (`*.test.tsx` under `apps/frontend/test` or next to components).
- Add API tests alongside `src` modules when introduced; prefer lightweight integration-style tests per route/handler.
- Mock external calls with MSW where possible; validate i18n strings via existing locales in `apps/frontend/locales`.

## Commit & Pull Request Guidelines
- Follow Conventional Commits seen in history (`feat:`, `fix:`, `docs:`, `refactor:`); include scope when useful (e.g., `feat(api): add auth routes`).
- PRs should describe behavior, steps to verify, and link issues. Attach screenshots or GIFs for UI-facing changes.
- Keep changes small and cohesive; ensure lint/test pass (`bun run lint`, `bun test`) before requesting review.

## Security & Configuration Tips
- Never commit `.env` files; keep secrets in local env or deployment secrets store.
- Database migrations reside in `apps/api/drizzle`; run them before starting the API in new environments.
- For new env keys, update both `.env.example` files, add or adjust validators in `apps/api/src/env.ts`, and document changes in `apps/docs/reference/environment-variables.md` (and related docs).
- Document any env var additions or changes in `apps/docs/reference/environment-variables.md` (and related docs where applicable) so deployers stay current.

## Design / UI / UX

See `apps/docs/reference/design-manifesto.md` 
