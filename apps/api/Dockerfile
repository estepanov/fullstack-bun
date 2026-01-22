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
# Copy API package files and config
COPY apps/api/package.json ./apps/api/
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/biome.json ./apps/api/
# Install all dependencies
RUN bun install

# Development stage
FROM base AS dev
WORKDIR /app
# Copy root package files for workspace resolution
COPY --chown=bunapp:bunapp package.json bun.lock ./
# Copy dependencies from deps stage (Bun hoists all dependencies to root node_modules)
COPY --from=deps --chown=bunapp:bunapp /app/node_modules ./node_modules
COPY --from=deps --chown=bunapp:bunapp /app/packages ./packages
# Copy source code
COPY --chown=bunapp:bunapp apps/api ./apps/api
# Copy api's node_modules from deps stage (contains workspace symlinks)
COPY --from=deps --chown=bunapp:bunapp /app/apps/api/node_modules ./apps/api/node_modules
# Expose API port
EXPOSE 3001
CMD ["bun", "--filter=api", "dev"]

# Production stage
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
# Copy root package files for workspace resolution
COPY --chown=bunapp:bunapp package.json bun.lock ./
# Copy dependencies (Bun hoists all dependencies to root node_modules)
COPY --from=deps --chown=bunapp:bunapp /app/node_modules ./node_modules
COPY --from=deps --chown=bunapp:bunapp /app/packages ./packages
# Copy source code
COPY --chown=bunapp:bunapp apps/api ./apps/api
# Copy api's node_modules from deps stage (contains workspace symlinks)
COPY --from=deps --chown=bunapp:bunapp /app/apps/api/node_modules ./apps/api/node_modules
# Drop privileges for runtime
USER bunapp
# Expose API port
EXPOSE 3001
CMD ["bun", "--filter=api", "start"]
