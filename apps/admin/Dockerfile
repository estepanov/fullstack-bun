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
# Copy admin package files and config
COPY apps/admin/package.json ./apps/admin/
COPY apps/admin/tsconfig*.json ./apps/admin/
COPY apps/admin/vite.config.ts ./apps/admin/
COPY apps/admin/react-router.config.ts ./apps/admin/
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
# Copy admin package files and config
COPY --chown=bunapp:bunapp apps/admin/package.json ./apps/admin/
COPY --chown=bunapp:bunapp apps/admin/tsconfig*.json ./apps/admin/
COPY --chown=bunapp:bunapp apps/admin/vite.config.ts ./apps/admin/
COPY --chown=bunapp:bunapp apps/admin/react-router.config.ts ./apps/admin/
# Copy source code
COPY --chown=bunapp:bunapp apps/admin ./apps/admin
# Install dependencies (this ensures they're available even if volumes override node_modules)
RUN bun install
# Clear Vite cache to ensure fresh dependency pre-bundling
RUN rm -rf /app/apps/admin/node_modules/.vite /app/node_modules/.vite
# Expose Vite dev server port
EXPOSE 5175
CMD ["bun", "--filter=admin", "dev"]

# Build stage
FROM base AS build
WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_API_BASE_URL
ARG VITE_FRONTEND_URL

# Set them as environment variables for the build process
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_FRONTEND_URL=${VITE_FRONTEND_URL}

# Copy root package files for workspace resolution
COPY --chown=bunapp:bunapp package.json bun.lock ./
# Copy dependencies and source (Bun hoists all dependencies to root node_modules)
COPY --from=deps --chown=bunapp:bunapp /app/node_modules ./node_modules
COPY --from=deps --chown=bunapp:bunapp /app/packages ./packages
# Copy API directory for TypeScript config resolution (including its node_modules)
COPY --from=deps --chown=bunapp:bunapp /app/apps/api ./apps/api
# Copy all admin files including config
COPY --chown=bunapp:bunapp apps/admin ./apps/admin
# Copy admin's node_modules from deps stage (contains workspace symlinks)
COPY --from=deps --chown=bunapp:bunapp /app/apps/admin/node_modules ./apps/admin/node_modules
# Build the app
WORKDIR /app/apps/admin
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS production
WORKDIR /app
RUN set -eux; \
  if ! getent group bunapp >/dev/null; then groupadd -r bunapp; fi; \
  if ! id bunapp >/dev/null 2>&1; then useradd -r -g bunapp bunapp; fi; \
  mkdir -p /app/apps/admin
ENV NODE_ENV=production
# Copy manifests for proper module/type resolution
COPY --from=build --chown=bunapp:bunapp /app/package.json ./package.json
COPY --from=build --chown=bunapp:bunapp /app/bun.lock ./bun.lock
COPY --from=build --chown=bunapp:bunapp /app/apps/admin/package.json ./apps/admin/package.json
# Copy necessary runtime dependencies and build output (Bun hoists all dependencies to root node_modules)
COPY --from=build --chown=bunapp:bunapp /app/node_modules ./node_modules
COPY --from=build --chown=bunapp:bunapp /app/apps/admin/build ./apps/admin/build
COPY --from=build --chown=bunapp:bunapp /app/apps/admin/server.ts ./apps/admin/server.ts
# Drop privileges for runtime
USER bunapp
# Expose production port
EXPOSE 5175
# Set working directory to admin app
WORKDIR /app/apps/admin
# Serve the built app
CMD ["bun", "run", "--bun", "server.ts"]
