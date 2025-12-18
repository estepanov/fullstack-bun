---
layout: doc
---

# Get Started

## Prerequisites

You will need to have the following installed your machine:

- Git
- [Bun](https://bun.sh)
- Docker (recommended) **or** a PostgreSQL + Redis instance you can connect to

## Start the projects

How to get started, a very rough initial guide.

1. Clone the repo:

```sh
git clone git@github.com:estepanov/fullstack-bun.git
```

2. Open project:

```sh
cd fullstack-bun
```

3. Install dependencies:

```sh
bun install
```

4. Run setup command

```sh
bun run setup
```

The setup commmand copies `.env.example` → `.env` for `apps/api` and `apps/frontend`.
Review those files and adjust as needed (especially `DATABASE_URL`, `BETTER_AUTH_SECRET`, and
`FE_BASE_URL`).

To learn more about specific variables visit the [environment variables reference page](/reference/environment-variables.md).

5. Start infrastructure (Postgres + Redis)

The project requires PostgreSQL and Redis. The recommended local approach is to run both via
Docker Compose:

```sh
cp .env.example .env
docker-compose up postgres redis -d
```

This starts PostgreSQL and Redis containers and exposes them on `localhost` using the ports from
the repo root `.env` (or the defaults in `docker-compose.yml`).

If you prefer to run *everything* in containers (frontend + API + Postgres + Redis), run:

```sh
bun run docker:dev
```

6. Run database migrations

After starting PostgreSQL, apply the existing migrations:

```sh
cd apps/api
bunx drizzle-kit migrate
cd ../..
```

If you make schema changes later, you can generate new migrations with `bunx drizzle-kit generate`.
For more information about the database setup, visit the [database reference page](/reference/database.md)
and the [Redis reference page](/reference/redis.md).

7. Start the app

To launch BOTH the frontend and backend you can run the dev command in the root of the project

```sh
bun run dev
```

8. Tada! Open [http://localhost:5173](http://localhost:5173) to see the app!
