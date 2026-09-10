#!/usr/bin/env bash
# Per-boot start script for the Fullstack Bun monorepo.
# Brings up the infrastructure the API depends on (PostgreSQL + Redis) and
# reconciles database migrations. Dependencies and data persist from the
# install/snapshot phase; this only restarts ephemeral processes.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

export PATH="$HOME/.bun/bin:$PATH"

echo "==> Starting PostgreSQL and Redis"
sudo service postgresql start
sudo service redis-server start

echo "==> Waiting for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
  if pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then break; fi
  sleep 1
done

echo "==> Verifying Redis"
redis-cli ping || true

# Apply any migrations added on the current branch. Safe/idempotent: Drizzle
# only applies pending migrations. Never blocks boot on failure.
if [ -f apps/api/.env ]; then
  echo "==> Applying database migrations"
  (cd apps/api && bun run db:migrate) || echo "WARN: migrations skipped/failed"
fi

echo "==> Start complete"
