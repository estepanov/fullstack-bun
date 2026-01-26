#!/bin/bash
set -e

echo "===================================="
echo "Running DevContainer post-create setup..."
echo "===================================="

# Ensure node_modules is writable for the devcontainer user.
WORKDIR="/workspace/fullstack-bun"
if [ -d "$WORKDIR" ]; then
  echo "🔐 Ensuring node_modules is writable..."
  sudo mkdir -p "$WORKDIR/node_modules"
  sudo chmod -R a+rwX "$WORKDIR/node_modules"
fi

# Install dependencies
echo "📦 Installing dependencies with bun..."
# Use copyfile backend to avoid hardlink issues on container filesystems.
bun install --backend=copyfile

# Run database migrations if API has migration scripts
if [ -d "apps/api" ]; then
  echo "🗄️  Running database migrations..."
  cd apps/api

  # Check if db:migrate script exists in package.json
  if bun run --silent 2>&1 | grep -q "db:migrate"; then
    bun run db:migrate || echo "⚠️  Migration failed or not configured. You may need to run this manually."
  else
    echo "ℹ️  No db:migrate script found. Skipping migrations."
  fi

  cd ../..
fi

echo "===================================="
echo "✅ DevContainer setup complete!"
echo "===================================="
echo ""
echo "🚀 Quick start commands:"
echo "  - bun run dev          # Start all services (API, Frontend, Admin)"
echo "  - bun run test         # Run tests"
echo "  - bun run lint         # Run linting"
echo "  - bun run format       # Format code"
echo ""
echo "📚 See .devcontainer/README.md for more information"
echo ""
