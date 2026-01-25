#!/bin/bash
set -e

echo "===================================="
echo "Running DevContainer post-start checks..."
echo "===================================="

# Function to wait for a TCP port
wait_for_port() {
  local service_name=$1
  local host=$2
  local port=$3
  local max_attempts=30
  local attempt=1

  echo "⏳ Waiting for $service_name ($host:$port) to be ready..."

  while [ $attempt -le $max_attempts ]; do
    if timeout 1 bash -c "cat < /dev/null > /dev/tcp/$host/$port" 2>/dev/null; then
      echo "✅ $service_name is ready!"
      return 0
    fi

    if [ $attempt -eq 1 ] || [ $((attempt % 5)) -eq 0 ]; then
      echo "   Attempt $attempt/$max_attempts..."
    fi
    sleep 2
    attempt=$((attempt + 1))
  done

  echo "⚠️  Warning: $service_name not ready after $max_attempts attempts"
  return 1
}

# Check PostgreSQL connectivity
wait_for_port "PostgreSQL" "postgres" "5432" || true

# Check Redis connectivity
wait_for_port "Redis" "redis" "6379" || true

echo "===================================="
echo "✅ DevContainer ready!"
echo "===================================="
echo ""
echo "💡 Tip: Use 'Tasks: Run Task' (Ctrl+Shift+P) to access common commands"
echo ""

# Attempt to open the multi-root workspace when running under VS Code
workspace_file="/workspace/fullstack-bun/fullstack-bun.code-workspace"
if [ -f "${workspace_file}" ] && command -v code >/dev/null 2>&1; then
  code "${workspace_file}" >/dev/null 2>&1 || true
fi
