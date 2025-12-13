# Fullstack Bun

- Vite
- TypeScript
- React 19
- TailwindCSS 4
- Shadcn
- Biome
- Pino
- Hono

## Get Started

PLEASE SEE https://fullstackbun.dev/get-started/

A highly abbreviated version of the instructions is below:

 - from the root directory `bun install`
 - Run `bun run setup` to:
    - copy the environment files from `.env.example` to `.env` in both the API and frontend directories
 - then `bun run dev`

### Commands

To install a package, `cd` into the package directory and run `bun install`.

_Do not install packages at the root level, with few exceptions._

To run the frontend and backend apps, `bun run dev` from the root level.

## Docker

This monorepo supports containerized development and production deployment with Docker.

**Quick Start:**
```bash
# Development
bun run docker:dev:build

# Production
bun run docker:prod:build
```

For complete Docker documentation, see [apps/docs/docker.md](apps/docs/docker.md).

