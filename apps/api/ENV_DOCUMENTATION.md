# API Environment Variables Documentation

This document describes all environment variables used by the API.

## Server Configuration

### `NODE_ENV`
- **Type:** `development` | `production` | `test`
- **Default:** `development`
- **Description:** Runtime environment mode

### `PORT`
- **Type:** Number
- **Default:** `3001`
- **Description:** Port the API server listens on

### `CORS_ALLOWLISTED_ORIGINS`
- **Type:** Comma-separated URLs
- **Required:** Yes
- **Example:** `http://localhost:5173,http://localhost:5175`
- **Description:** List of allowed CORS origins for cross-origin requests

## Database

### `DATABASE_URL`
- **Type:** PostgreSQL connection string
- **Required:** Yes
- **Example:** `postgresql://user:password@localhost:5432/database`
- **Description:** PostgreSQL database connection URL

## Redis

### `REDIS_URL`
- **Type:** Redis connection string
- **Required:** Yes
- **Example:** `redis://:password@localhost:6379`
- **Description:** Redis connection URL for caching and pub/sub

## Horizontal Scaling

### `INSTANCE_ID`
- **Type:** String
- **Required:** No (auto-generated if not set)
- **Example:** `api-1`, `api-pod-xyz`, `${HOSTNAME}`
- **Description:** Unique identifier for this API instance. Used to distinguish between multiple instances in horizontal scaling scenarios. Auto-generated using UUID if not provided.
- **Recommendation:** Set to container hostname in production for better observability

### `ENABLE_DISTRIBUTED_CHAT`
- **Type:** `true` | `false`
- **Default:** `true`
- **Description:** Enable distributed chat mode using Redis pub/sub for cross-instance WebSocket messaging. Set to `false` for single-instance mode.

## Metrics Authentication

### `METRICS_API_KEY`
- **Type:** String (min 32 characters)
- **Required:** No (but strongly recommended for production)
- **Example:** Generate with `openssl rand -base64 32`
- **Description:** API key for accessing the `/metrics` endpoint. If not set, only authenticated admin users can access metrics.

**Security Note:** The `/metrics` endpoint exposes sensitive infrastructure information including:
- Instance IDs and cluster topology
- Connected client counts
- Pub/sub performance metrics
- System health data

**Usage:**
```bash
# Generate a secure key
METRICS_API_KEY=$(openssl rand -base64 32)

# Access metrics
curl -H "Authorization: Bearer YOUR_KEY" https://api.yourdomain.com/metrics
```

**Access Methods:**
1. **Admin Session:** Authenticated admin users can access without API key
2. **API Key:** Use `Authorization: Bearer <key>` header (recommended for monitoring tools)

## Authentication (Better Auth)

### `BETTER_AUTH_SECRET`
- **Type:** String (min 32 characters)
- **Required:** Yes
- **Example:** Generate with `openssl rand -base64 32`
- **Description:** Secret key for signing authentication tokens

### `API_BASE_URL`
- **Type:** URL
- **Required:** Yes
- **Example:** `https://api.yourdomain.com`
- **Description:** Base URL of your API server (used for auth callbacks)

### `FE_BASE_URL`
- **Type:** URL
- **Required:** Yes
- **Example:** `https://yourdomain.com`
- **Description:** Base URL of your frontend (used for redirects after authentication)

## Email (SMTP) - Optional

### `SMTP_HOST`
- **Type:** String
- **Required:** No
- **Example:** `smtp.gmail.com`
- **Description:** SMTP server hostname for sending emails

### `SMTP_PORT`
- **Type:** Number
- **Required:** No
- **Example:** `587`
- **Description:** SMTP server port

### `SMTP_USER`
- **Type:** String
- **Required:** No
- **Description:** SMTP authentication username

### `SMTP_PASSWORD`
- **Type:** String
- **Required:** No
- **Description:** SMTP authentication password

### `SMTP_FROM`
- **Type:** Email address
- **Required:** No
- **Example:** `noreply@example.com` or `My App <noreply@example.com>`
- **Description:** Email "From" address for outgoing emails

## OAuth Providers - Optional

### `GITHUB_CLIENT_ID`
- **Type:** String
- **Required:** No
- **Description:** GitHub OAuth application client ID

### `GITHUB_CLIENT_SECRET`
- **Type:** String
- **Required:** No
- **Description:** GitHub OAuth application client secret

## Production Deployment Checklist

When deploying to production, ensure:

- [ ] `NODE_ENV=production`
- [ ] Strong `BETTER_AUTH_SECRET` (min 32 chars, use `openssl rand -base64 32`)
- [ ] Strong `METRICS_API_KEY` (min 32 chars, use `openssl rand -base64 32`)
- [ ] Correct `API_BASE_URL` and `FE_BASE_URL` (use your actual domain)
- [ ] Proper `CORS_ALLOWLISTED_ORIGINS` (only your frontend domains)
- [ ] Secure Redis connection (use password, TLS if exposed)
- [ ] Secure PostgreSQL connection (strong password, encrypted connection)
- [ ] `ENABLE_DISTRIBUTED_CHAT=true` if running multiple instances
- [ ] Unique `INSTANCE_ID` per instance (e.g., `${HOSTNAME}`)

## Docker Compose Example

```yaml
services:
  api-1:
    image: your-api:latest
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
      - REDIS_URL=redis://:password@redis:6379
      - ENABLE_DISTRIBUTED_CHAT=true
      - INSTANCE_ID=api-1
      - METRICS_API_KEY=${METRICS_API_KEY}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - API_BASE_URL=https://api.yourdomain.com
      - FE_BASE_URL=https://yourdomain.com
      - CORS_ALLOWLISTED_ORIGINS=https://yourdomain.com
```
