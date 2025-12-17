---
layout: doc
---

# Get Started

## Prerequisites

You will need to have the following installed your machine:

- Git
- [Bun](https://bun.sh)

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

The setup commmand currently just copies `.env.example` to `.env` in the front and backend projects. 

Add the following to `apps/api/.env`:

```txt
CORS_ALLOWLISTED_ORIGINS="http://localhost:3000"
PORT="3001"
NODE_ENV="development"
```

Add the following to `apps/frontend/.env`:

```txt
VITE_API_BASE_URL="http://localhost:3001"
NODE_ENV="development"
```

To learn more about specific variables visit the [environment variables reference page](/reference/environment-variables.md).

5. Start the database

The project uses PostgreSQL, which runs via Docker Compose. Start the database service:

```sh
bun run docker:dev
```

This will start both PostgreSQL and Redis in Docker containers.

6. Run database migrations

After starting the database, you need to generate and apply the database migrations:

```sh
cd apps/api
bunx drizzle-kit generate
bunx drizzle-kit migrate
cd ../..
```

The `generate` command creates migration files based on your schema, and `migrate` applies them to your database. For more information about the database setup, visit the [database reference page](/reference/database.md).

7. Start the app

To launch BOTH the frontend and backend you can run the dev command in the root of the project

```sh
bun run dev
```

8. Tada! Open [http://localhost:3000](http://localhost:3000) to see the app!
