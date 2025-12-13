---
layout: doc
---

# Environment Variables

This page details every enivornment variable across the stack.

## API

The `.env` for `/apps/api`

### `CORS_ALLOWLISTED_ORIGINS`

This is a comma seperated list of domains allowed to make CORS requests.
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

## Frontend

The `.env` for `/apps/frontend`

### `VITE_API_BASE_URL`

**Required.** This is the base URL for your API. For example when running locally this could be `http://localhost:3001`

```txt
VITE_API_BASE_URL="http://localhost:3001"
```

### `VITE_I18N_CDN_URL`

**Optional.** CDN URL for serving translation files in production. Leave empty to serve translations from the same domain.

```txt
# Leave empty for local development
VITE_I18N_CDN_URL=""

# Or use a CDN in production
VITE_I18N_CDN_URL="https://cdn.example.com"
```

### `NODE_ENV`

In local development `development` and for all static builds it should be `production`

## Docker Environment Variables

When using Docker (via `docker-compose.yml` or `docker-compose.prod.yml`), additional environment variables are available at the root level. See the [Docker documentation](/docker.html#environment-variables) for details on:

- Database configuration (PostgreSQL)
- Cache configuration (Redis)
- Port mappings
- Production-specific settings
