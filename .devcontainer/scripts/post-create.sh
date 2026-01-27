#!/bin/bash
set -e

echo "===================================="
echo "Running DevContainer post-create setup..."
echo "===================================="

# Fix workspace ownership for the devcontainer user
WORKDIR="/workspace/fullstack-bun"
CURRENT_USER=$(whoami)
echo "🔐 Fixing workspace permissions for user: $CURRENT_USER..."

# Only fix ownership if we're not root and the directory isn't already owned by us
if [ "$CURRENT_USER" != "root" ] && [ "$(stat -c '%U' "$WORKDIR" 2>/dev/null || stat -f '%Su' "$WORKDIR")" != "$CURRENT_USER" ]; then
  sudo chown -R "$CURRENT_USER:$(id -gn)" "$WORKDIR"
fi

# Install dependencies
echo "📦 Installing dependencies with bun..."
# Configuration is managed via bunfig.toml (hoisted linker + hardlink backend)
bun install

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
