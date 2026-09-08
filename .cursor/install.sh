#!/usr/bin/env bash
# Idempotent Cloud Agent install script for the Fullstack Bun monorepo.
# Prepares the base image + repository dependencies so the app can run:
#   - Bun runtime
#   - PostgreSQL + Redis (system packages)
#   - Workspace JS dependencies
#   - .env files for api / frontend / admin
#   - Database role, database, and Drizzle migrations
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

export PATH="$HOME/.bun/bin:$PATH"

echo "==> Ensuring Bun is installed"
if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi
bun --version

echo "==> Ensuring PostgreSQL and Redis are installed"
if ! command -v pg_ctlcluster >/dev/null 2>&1 || ! command -v redis-server >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    postgresql postgresql-contrib redis-server
fi

echo "==> Starting PostgreSQL and Redis (needed for migrations)"
sudo service postgresql start
sudo service redis-server start

echo "==> Waiting for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
  if pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then break; fi
  sleep 1
done

echo "==> Configuring PostgreSQL role and database"
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER USER postgres WITH PASSWORD 'postgres';"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='mydatabase'" | grep -q 1; then
  sudo -u postgres createdb mydatabase
fi

echo "==> Installing workspace dependencies"
bun install

echo "==> Generating .env files (only if missing)"
if [ ! -f apps/api/.env ]; then
  cp apps/api/.env.example apps/api/.env
  # Local Redis has no password; point at localhost.
  sed -i 's#^REDIS_URL=.*#REDIS_URL="redis://localhost:6379"#' apps/api/.env
  # Better Auth requires a >= 32 char secret.
  SECRET="$(openssl rand -base64 32)"
  sed -i "s#^BETTER_AUTH_SECRET=.*#BETTER_AUTH_SECRET=\"${SECRET}\"#" apps/api/.env
fi
[ -f apps/frontend/.env ] || cp apps/frontend/.env.example apps/frontend/.env
[ -f apps/admin/.env ] || cp apps/admin/.env.example apps/admin/.env

echo "==> Applying database migrations"
(cd apps/api && bun run db:migrate)

echo "==> Install complete"
