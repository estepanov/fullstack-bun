# syntax=docker/dockerfile:1

# Base stage with Bun
FROM oven/bun:1 AS base
WORKDIR /app
RUN set -eux; \
  if ! getent group bunapp >/dev/null; then groupadd -r bunapp; fi; \
  if ! id bunapp >/dev/null 2>&1; then useradd -r -g bunapp bunapp; fi

# Install dependencies stage
FROM base AS deps
# Copy root package files
COPY package.json bun.lock ./
# Copy workspace packages
COPY packages ./packages
# Copy frontend package files and config
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/frontend/tsconfig*.json ./apps/frontend/
COPY apps/frontend/vite.config.ts ./apps/frontend/
COPY apps/frontend/react-router.config.ts ./apps/frontend/
COPY apps/frontend/bunfig.toml ./apps/frontend/
# Copy entire API directory (needed for workspace dependencies and TypeScript config)
COPY apps/api ./apps/api
# Install all dependencies
RUN bun install

# Development stage
FROM base AS dev
WORKDIR /app
# Copy root package files for workspace resolution
COPY --chown=bunapp:bunapp package.json bun.lock ./
# Copy workspace packages
COPY --chown=bunapp:bunapp packages ./packages
# Copy API directory for TypeScript config resolution
COPY --chown=bunapp:bunapp apps/api/package.json ./apps/api/package.json
COPY --chown=bunapp:bunapp apps/api/tsconfig*.json ./apps/api/
# Copy frontend package files and config
COPY --chown=bunapp:bunapp apps/frontend/package.json ./apps/frontend/
COPY --chown=bunapp:bunapp apps/frontend/tsconfig*.json ./apps/frontend/
COPY --chown=bunapp:bunapp apps/frontend/vite.config.ts ./apps/frontend/
COPY --chown=bunapp:bunapp apps/frontend/react-router.config.ts ./apps/frontend/
COPY --chown=bunapp:bunapp apps/frontend/bunfig.toml ./apps/frontend/
# Copy source code
COPY --chown=bunapp:bunapp apps/frontend ./apps/frontend
# Install dependencies (this ensures they're available even if volumes override node_modules)
RUN bun install
# Clear Vite cache to ensure fresh dependency pre-bundling
RUN rm -rf /app/node_modules/.vite
# Expose Vite dev server port
EXPOSE 5173
CMD ["bun", "--filter=frontend", "dev"]

# Build stage
FROM base AS build
WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_API_BASE_URL
ARG VITE_ADMIN_URL

# Set them as environment variables for the build process
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_ADMIN_URL=${VITE_ADMIN_URL}

# Copy root package files for workspace resolution
COPY --chown=bunapp:bunapp package.json bun.lock ./
# Copy dependencies and source (Bun hoists all dependencies to root node_modules)
COPY --from=deps --chown=bunapp:bunapp /app/node_modules ./node_modules
COPY --from=deps --chown=bunapp:bunapp /app/packages ./packages
# Copy API directory for TypeScript config resolution
COPY --from=deps --chown=bunapp:bunapp /app/apps/api ./apps/api
# Copy all frontend files including config
COPY --chown=bunapp:bunapp apps/frontend ./apps/frontend
# Build the app
WORKDIR /app/apps/frontend
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS production
WORKDIR /app
RUN set -eux; \
  if ! getent group bunapp >/dev/null; then groupadd -r bunapp; fi; \
  if ! id bunapp >/dev/null 2>&1; then useradd -r -g bunapp bunapp; fi; \
  mkdir -p /app/apps/frontend
ENV NODE_ENV=production
# Copy manifests for proper module/type resolution
COPY --from=build --chown=bunapp:bunapp /app/package.json ./package.json
COPY --from=build --chown=bunapp:bunapp /app/bun.lock ./bun.lock
COPY --from=build --chown=bunapp:bunapp /app/apps/frontend/package.json ./apps/frontend/package.json
# Copy necessary runtime dependencies and build output (Bun hoists all dependencies to root node_modules)
COPY --from=build --chown=bunapp:bunapp /app/node_modules ./node_modules
COPY --from=build --chown=bunapp:bunapp /app/apps/frontend/build ./apps/frontend/build
COPY --from=build --chown=bunapp:bunapp /app/apps/frontend/server.ts ./apps/frontend/server.ts
# Drop privileges for runtime
USER bunapp
# Expose production port
EXPOSE 5173
# Set working directory to frontend app
WORKDIR /app/apps/frontend
# Serve the built app
CMD ["bun", "run", "--bun", "server.ts"]
