# Docker Setup Guide

This guide explains how to use Docker to run the fullstack-bun monorepo in both development and production environments.

## Architecture

This monorepo contains:
- **Frontend**: React app with Vite and React Router
- **API**: Hono server running on Bun
- **PostgreSQL**: Database service
- **Redis**: Cache/session store

## Prerequisites

- Docker and Docker Compose installed
- Bun installed (for local development without Docker)

## Development Setup

### Quick Start with npm scripts

```bash
# Start all services in development mode
bun run docker:dev

# Start with rebuild (after dependency changes)
bun run docker:dev:build

# Stop all services
bun run docker:dev:down

# Stop and remove volumes (clears database data)
bun run docker:dev:clean
```

### Manual Docker Compose commands

```bash
# Start all services
docker-compose up

# Start with rebuild
docker-compose up --build
```

This will start:
- Frontend on http://localhost:5173 (HMR on :5174)
- API on http://localhost:3001
- PostgreSQL on localhost:5432
- Redis on localhost:6379


### Start specific services

```bash
# Start only the API
docker-compose up api

# Start only the frontend
docker-compose up frontend

# Start backend services (postgres, redis, api)
docker-compose up postgres redis api
```

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
```

### Stop services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears database data)
docker-compose down -v
```

## Production Setup

### Quick Start with npm scripts

```bash
# Start production environment
bun run docker:prod

# Start with rebuild
bun run docker:prod:build

# Stop production services
bun run docker:prod:down

# Stop and remove volumes
bun run docker:prod:clean
```

### Manual Docker Compose commands

```bash
# Build and run production images
docker-compose -f docker-compose.prod.yml up -d --build

# Stop production services
docker-compose -f docker-compose.prod.yml down
```

This will:
- Build optimized production images
- Run frontend on http://localhost:5173
- Run API on http://localhost:3001
- Keep PostgreSQL and Redis isolated on the internal Docker network (access via `docker-compose exec`)

To connect for maintenance, run commands such as `docker-compose -f docker-compose.prod.yml exec postgres psql -U $POSTGRES_USER $POSTGRES_DB` or `docker-compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD`.

### Environment Variables

1. Copy the example file:
```bash
cp .env.example .env
```

2. Update `.env` with your production values:

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=mydatabase
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password_here

# Application Ports
API_PORT=3001
FRONTEND_PORT=5173

# Production Configuration
CORS_ALLOWLISTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

**Important**: Always use strong passwords and secure values in production!
Redis is configured to require authentication—set `REDIS_PASSWORD` and keep it secret (e.g., load from your secret manager).

## Development Features

### Hot Reload

Both frontend and API support hot reload:
- Changes to `apps/frontend/src/*` will reload the frontend
- Changes to `apps/api/src/*` will reload the API
- Changes to `packages/*` will be picked up by both apps
- Config file changes (vite.config.ts, tsconfig.json, etc.) are also mounted

### Volume Mounts

Development containers mount source code and config as volumes:

**Frontend:**
- `./apps/frontend/src` → `/app/apps/frontend/src`
- `./apps/frontend/public` → `/app/apps/frontend/public`
- `./apps/frontend/locales` → `/app/apps/frontend/locales`
- `./apps/frontend/vite.config.ts` → `/app/apps/frontend/vite.config.ts` (read-only)
- `./apps/frontend/react-router.config.ts` → `/app/apps/frontend/react-router.config.ts` (read-only)
- `./apps/frontend/tsconfig*.json` → `/app/apps/frontend/tsconfig*.json` (read-only)

**API:**
- `./apps/api/src` → `/app/apps/api/src`
- `./apps/api/tsconfig*.json` → `/app/apps/api/tsconfig*.json` (read-only)

**Shared:**
- `./packages` → `/app/packages`
- `./package.json` → `/app/package.json` (read-only)

Node modules are preserved using anonymous volumes to prevent overwriting.

## Dockerfile Details

### Frontend Dockerfile

Multi-stage build:
1. **deps**: Installs dependencies
2. **dev**: Development server with Vite
3. **build**: Builds production assets
4. **production**: Serves built app with Hono

### API Dockerfile

Multi-stage build:
1. **deps**: Installs dependencies
2. **dev**: Development server with Bun watch mode
3. **production**: Production server

## Troubleshooting

### Port conflicts

If ports are already in use, modify `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "5174:5173"  # Use port 5174 on host instead
```

### Container won't start

Check logs:
```bash
docker-compose logs api
docker-compose logs frontend
```

### Dependencies not installing

Rebuild without cache:
```bash
docker-compose build --no-cache
```

### Database connection issues

Ensure the API waits for PostgreSQL:
```bash
docker-compose up postgres  # Wait for healthy
docker-compose up api       # Then start API
```

Or use the healthcheck dependencies (already configured).

## Useful Commands

### NPM Scripts (Recommended)

```bash
# Development
bun run docker:dev              # Start dev environment
bun run docker:dev:build        # Rebuild and start
bun run docker:dev:down         # Stop dev services
bun run docker:dev:clean        # Stop and remove volumes

# Production
bun run docker:prod             # Start production
bun run docker:prod:build       # Rebuild and start
bun run docker:prod:down        # Stop production
bun run docker:prod:clean       # Stop and remove volumes
```

### Docker Compose Commands

```bash
# Enter a running container
docker-compose exec api sh
docker-compose exec frontend sh

# Run commands inside containers
docker-compose exec api bun run lint
docker-compose exec frontend bun test

# Remove all containers and volumes
docker-compose down -v

# Rebuild specific service
docker-compose build api
docker-compose build frontend

# View running containers
docker-compose ps

# Check resource usage
docker stats
```

## CI/CD Integration

For CI/CD pipelines, you can:

1. Build images:
```bash
docker build -f apps/api/Dockerfile -t myapp-api:latest .
docker build -f apps/frontend/Dockerfile -t myapp-frontend:latest .
```

2. Run tests in containers:
```bash
docker-compose run --rm frontend bun test
```

3. Push to registry:
```bash
docker tag myapp-api:latest registry.example.com/myapp-api:latest
docker push registry.example.com/myapp-api:latest
```

## Best Practices

1. **Don't commit .env files** - Use `.env.example` as template
2. **Use specific versions** - Pin Docker image versions in production
3. **Health checks** - Already configured for all services
4. **Resource limits** - Add memory/CPU limits for production
5. **Security** - Don't run as root, use read-only filesystems where possible
