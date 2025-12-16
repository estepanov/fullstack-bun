---
layout: doc
---

# Environment Variables

This page details every enivornment variable across the stack.
When adding a new API variable, define it in `apps/api/src/env.ts` (with validation), update the appropriate `.env.example`, and document it here.

## API

The `.env` for `/apps/api`

### `CORS_ALLOWLISTED_ORIGINS`

This is a comma seperated list of domains allowed to make CORS requests.
Values are cleaned (trimmed and stripped of quotes) and returned as an array for the API, so keep them comma-separated.
For example, the following allow lists only `http://localhost:3000`:

```txt
CORS_ALLOWLISTED_ORIGINS="http://localhost:3000"
```

However, you can also add multiple hosts like:

```txt
CORS_ALLOWLISTED_ORIGINS="http://localhost:3000,http://localhost:4000"
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

### `BETTER_AUTH_SECRET`

**Required.** Secret key for better-auth. Generate with `openssl rand -base64 32`.

```txt
BETTER_AUTH_SECRET="your-secret-key-here"
```

Keep this value secure and never commit it to version control.

### `FE_BASE_URL`

**Required.** The URL where your FE is hosted. Used for generating email verification links.

```txt
# Local development
FE_BASE_URL="http://localhost:3001"

# Production
FE_BASE_URL="https://api.yourdomain.com"
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

## Docker Environment Variables

When using Docker (via `docker-compose.yml` or `docker-compose.prod.yml`), additional environment variables are available at the root level. See the [Docker documentation](/docker.html#environment-variables) for details on:

- Database configuration (PostgreSQL)
- Cache configuration (Redis)
- Port mappings
- Production-specific settings
