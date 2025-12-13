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

This is the base URL for your API. For example when running locally this could be `http://localhost:3001`

### `NODE_ENV`

In local development `development` and for all static builds it should be `production`
