---
layout: doc
---

# Environment Variables

This page details every enivornment variable across the stack.
When adding a new API variable, define it in `apps/api/src/env.ts` (with validation), update the appropriate `.env.example`, and document it here.

## Docker Compose (root) (optional)

The repo root `.env` is used by Docker Compose (`docker-compose.yml` and `docker-compose.prod.yml`). 
Start by copying:

```sh
cp .env.example .env
```

### `POSTGRES_USER`

PostgreSQL username (Docker Compose).

### `POSTGRES_PASSWORD`

PostgreSQL password (Docker Compose). Use a strong value in production.

### `POSTGRES_DB`

PostgreSQL database name (Docker Compose).

### `POSTGRES_PORT`

Host port mapping for PostgreSQL (defaults to `5432`).

### `REDIS_PORT`

Host port mapping for Redis (defaults to `6379`).

### `REDIS_PASSWORD`

Redis password (required by the provided Compose config). Use a strong value in production.

### `API_PORT`

Host port mapping for the API container (defaults to `3001`).

### `FRONTEND_PORT`

Host port mapping for the frontend container (defaults to `5173` in this repo).

### `FRONTEND_HMR_PORT`

Host port mapping for the Vite HMR websocket (development Compose only).

### `DATABASE_URL_INTERNAL`

**Optional.** _(only in root `.env`)_ You probably do not need this. Override the database URL used *inside* the API container. If unset, the Compose
files build a URL from `POSTGRES_*` variables and use the service hostname `postgres`. 

## API

The `.env` for `/apps/api`

### `CORS_ALLOWLISTED_ORIGINS`

This is a comma seperated list of domains allowed to make CORS requests.
Values are cleaned (trimmed and stripped of quotes) and returned as an array for the API, so keep them comma-separated.
For example, the following allow lists only `http://localhost:5173`:

```txt
CORS_ALLOWLISTED_ORIGINS="http://localhost:5173"
```

However, you can also add multiple hosts like:

```txt
CORS_ALLOWLISTED_ORIGINS="http://localhost:5173,http://localhost:5175"
```

### `PORT`

This is the port used for your API server. Defaults to `3001`.

### `NODE_ENV`

In local development `development` and for all static builds it should be `production`

### `DATABASE_URL`

**Required.** PostgreSQL connection string for the database.

```txt
DATABASE_URL="postgresql://user:password@host:port/database"
```

Example for local development:

```txt
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydatabase"
```

### `REDIS_URL`

**Required.** Redis connection string.

```txt
REDIS_URL="redis://:redispassword@redis:6379"
```

### `ENABLE_DISTRIBUTED_CHAT`

**Optional.** Enable horizontal scaling mode for the API. When `true`, multiple API instances can run concurrently and share WebSocket connections via Redis pub/sub.

**Default:** `true` (enabled)

```txt
ENABLE_DISTRIBUTED_CHAT=true
```

Set to `false` to run in single-instance mode (useful for local development or debugging):

```txt
ENABLE_DISTRIBUTED_CHAT=false
```

::: tip
For production deployments with multiple replicas, keep this enabled. For local development, you can disable it to simplify setup.
:::

**See also:** [Horizontal Scaling Guide](/reference/horizontal-scaling) for detailed deployment instructions.

### `INSTANCE_ID`

**Optional.** Custom identifier for this API instance. Used for monitoring and observability in horizontally scaled deployments.

If not set, a unique ID is auto-generated in the format `api-<uuid>`.

```txt
INSTANCE_ID=api-1
```

::: tip
Only relevant when `ENABLE_DISTRIBUTED_CHAT=true`. Setting a custom ID makes it easier to identify instances in metrics and logs.
:::

### `METRICS_API_KEY`

**Optional but recommended for production.** API key for authenticating access to the `/metrics` endpoint. Minimum 32 characters.

The `/metrics` endpoint exposes sensitive infrastructure information including instance IDs, cluster topology, connected client counts, and system health data. This endpoint is protected by authentication to prevent unauthorized access.

**Authentication methods:**
1. **Admin session** - Logged-in admin users can access without API key
2. **API key** - Use `Authorization: Bearer <key>` header (recommended for monitoring tools)

**Generate a secure key:**
```bash
# Option 1: OpenSSL (recommended)
openssl rand -base64 32

# Option 2: UUID
uuidgen
```

**Example:**
```txt
METRICS_API_KEY="AbCd1234EfGh5678IjKl9012MnOp3456"
```

**Usage:**
```bash
curl -H "Authorization: Bearer YOUR_METRICS_API_KEY" https://api.yourdomain.com/metrics
```

::: warning Security
- Never commit this key to version control
- Store in secrets management (e.g., Doppler, AWS Secrets Manager, etc.)
- Rotate every 90 days in production
- If not set, only authenticated admin users can access metrics
:::

::: tip
Essential for monitoring tools like Prometheus, Grafana, Datadog, etc. See the [Horizontal Scaling Guide](/reference/horizontal-scaling#metrics-endpoint-security) for more details.
:::

### `BETTER_AUTH_SECRET`

**Required.** Secret key for better-auth. Generate with `openssl rand -base64 32`.

```txt
BETTER_AUTH_SECRET="your-secret-key-here"
```

Keep this value secure and never commit it to version control.

### `API_BASE_URL`

**Required.** The API base URL (used for OAuth callbacks).

```txt
API_BASE_URL="http://localhost:3001"
```

### `FE_BASE_URL`

**Required.** The URL where your FE is hosted. Used for generating email verification links.

```txt
# Local development
FE_BASE_URL="http://localhost:5173"

# Production
FE_BASE_URL="https://app.yourdomain.com"
```

### `SMTP_HOST`

**Required for email verification.** SMTP server hostname.

```txt
SMTP_HOST="smtp.gmail.com"
```

### `SMTP_PORT`

**Required for email verification.** SMTP server port (usually 587 for TLS).

```txt
SMTP_PORT="587"
```

### `SMTP_USER`

**Required for email verification.** SMTP authentication username.

```txt
SMTP_USER="your-email@gmail.com"
```

### `SMTP_PASSWORD`

**Required for email verification.** SMTP authentication password.

For Gmail, use an App Password: https://support.google.com/mail/answer/185833

```txt
SMTP_PASSWORD="your-app-password"
```

### `SMTP_FROM`

**Required for email verification.** Email address to send from.

```txt
SMTP_FROM="Fullstack Bun <noreply@example.com>"
```

### `GITHUB_CLIENT_ID`

**Optional.** GitHub OAuth application client ID for social login.

```txt
GITHUB_CLIENT_ID="your-github-client-id"
```

### `GITHUB_CLIENT_SECRET`

**Optional.** GitHub OAuth application client secret for social login.

```txt
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## Frontend

The `.env` for `/apps/frontend`

### `VITE_API_BASE_URL`

**Required.** This is the base URL for your API. For example when running locally this could be `http://localhost:3001`

```txt
VITE_API_BASE_URL="http://localhost:3001"
```

### `NODE_ENV`

In local development `development` and for all static builds it should be `production`

## Admin

The `.env` for `/apps/admin`

### `VITE_API_BASE_URL`

**Required.** Base URL for the API used by the admin UI.

```txt
VITE_API_BASE_URL="http://localhost:3001"
```

### `VITE_FRONTEND_URL`

**Required.** Base URL for the main frontend app (used for linking back).

```txt
VITE_FRONTEND_URL="http://localhost:5173"
```

### `NODE_ENV`

In local development `development` and for all static builds it should be `production`

## Notes on Docker vs Local

- Docker Compose loads env from the repo root `.env` plus `apps/api/.env` and `apps/frontend/.env`.
- For local (non-Docker) development, only the app-specific `.env` files matter.
