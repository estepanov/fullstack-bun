---
layout: doc
---

# Redis

This repo provisions a Redis service alongside PostgreSQL for cache / session-style workloads.

## Overview

- **Service:** Redis 7
- **Default port:** `6379` (configurable via `REDIS_PORT`)
- **Auth:** enabled via `REDIS_PASSWORD` (Docker Compose config)

## Local Development (Docker Compose)

1. Copy the root env template (used by Docker Compose):

```sh
cp .env.example .env
```

2. Start Redis (and Postgres if you want the full backend infra):

```sh
docker-compose up redis -d
# or:
docker-compose up postgres redis -d
```

3. Connect from your host machine:

```sh
redis-cli -h localhost -p "${REDIS_PORT:-6379}" -a "${REDIS_PASSWORD}"
```

## Container Networking

When connecting from another container in the same Compose network, use:

- **Host:** `redis`
- **Port:** `6379`

Example (from inside a container):

```sh
redis-cli -h redis -p 6379 -a "$REDIS_PASSWORD"
```

## Configuration

Redis is configured in `docker-compose.yml` and `docker-compose.prod.yml` to require a password.
In development, the password defaults via `.env` (see `.env.example`).

Documented environment variables:

- `REDIS_PORT`
- `REDIS_PASSWORD`

