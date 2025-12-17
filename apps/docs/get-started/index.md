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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydatabase"
BETTER_AUTH_SECRET="your-generated-secret-here"
FE_BASE_URL="http://localhost:5173"
CORS_ALLOWLISTED_ORIGINS="http://localhost:5173"
PORT="3001"
NODE_ENV="development"
```

Add the following to `apps/frontend/.env`:

```txt
VITE_API_BASE_URL="http://localhost:3001"
NODE_ENV="development"
```

**Important:** Generate a secure `BETTER_AUTH_SECRET` using:
```sh
openssl rand -base64 32
```

To learn more about specific variables visit the [environment variables reference page](/reference/environment-variables.md).

5. Start the database

The project uses PostgreSQL and Redis, which run via Docker Compose. Start just the database services:

```sh
docker-compose up postgres redis -d
```

The `-d` flag runs them in detached mode (background). This will start PostgreSQL on port 5432 and Redis on port 6379.

**Note:** If you prefer to run everything (frontend, backend, and databases) in Docker, see the [Docker guide](/docker.html) instead.

6. Run database migrations

After starting the database, you need to generate and apply the database migrations:

```sh
cd apps/api
bunx drizzle-kit generate
bunx drizzle-kit migrate
cd ../..
```

The `generate` command creates migration files based on your schema, and `migrate` applies them to your database. For more information about the database setup, visit the [database reference page](/reference/database.md).

7. Configure email verification (optional)

For email verification to work, you'll need to configure SMTP settings in `apps/api/.env`. If you skip this step, verification URLs will be logged to the console during development, which is fine for testing.

See the [authentication reference](/reference/authentication.html#email-verification) for SMTP setup details.

8. Start the app

To launch BOTH the frontend and backend you can run the dev command in the root of the project

```sh
bun run dev
```

9. Tada! The app should now be running!

Once both services start successfully:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **API**: [http://localhost:3001](http://localhost:3001)

You can now:
- Register a new account at [http://localhost:5173/auth/register](http://localhost:5173/auth/register)
- Login at [http://localhost:5173/auth/login](http://localhost:5173/auth/login)
- Access the protected dashboard at [http://localhost:5173/dashboard](http://localhost:5173/dashboard) (requires authentication)
