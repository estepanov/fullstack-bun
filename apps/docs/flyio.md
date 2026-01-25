---
layout: doc
---

# Fly.io Deployment Guide

This guide covers deploying the fullstack-bun monorepo to Fly.io, a global edge platform with built-in support for WebSockets, horizontal scaling, and geographic distribution.

## Overview

### What is Fly.io?

[Fly.io](https://fly.io) is a platform that runs applications close to users by deploying them globally on edge servers. It provides:

- **Global edge deployment** - Run your app in multiple regions worldwide
- **Native WebSocket support** - Perfect for real-time features
- **Built-in load balancing** - Automatic traffic distribution
- **Simple scaling** - Horizontal and vertical scaling with CLI commands
- **Managed infrastructure** - Postgres, Redis, SSL certificates included

### Architecture

This deployment creates **3 separate Fly.io applications**:

```
┌─────────────────────────────────────────────────────────┐
│                      Fly.io Platform                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌──────────────────┐            │
│  │  Frontend App   │  │   Admin App      │            │
│  │  (React/Vite)   │  │   (React/Vite)   │            │
│  │  Port: 5173     │  │   Port: 5175     │            │
│  │  Min: 1         │  │   Min: 0 (idle)  │            │
│  └────────┬────────┘  └────────┬─────────┘            │
│           │                    │                       │
│           └──────────┬─────────┘                       │
│                      │                                 │
│           ┌──────────▼──────────┐                      │
│           │     API App         │                      │
│           │   (Hono/Bun)        │                      │
│           │   Port: 3001        │                      │
│           │   Min: 2 (HA)       │                      │
│           │   Distributed: ✓    │                      │
│           └──────────┬──────────┘                      │
│                      │                                 │
│       ┌──────────────┼──────────────┐                 │
│       │              │              │                 │
│  ┌────▼────┐   ┌────▼────┐   ┌────▼────┐             │
│  │ Postgres│   │  Redis  │   │   SSL   │             │
│  │ Cluster │   │  Cache  │   │  Certs  │             │
│  └─────────┘   └─────────┘   └─────────┘             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Why separate apps instead of process groups?**

- **Independent scaling** - Scale API, frontend, admin separately
- **Isolated failure domains** - Frontend issues don't affect API
- **Different deployment cadences** - Deploy components independently
- **Better cost control** - Admin can scale to 0 when idle
- **Resource isolation** - Allocate memory/CPU per component

## Prerequisites

### 1. Fly.io Account

Sign up at [fly.io/signup](https://fly.io/signup).

**Free tier includes:**
- Up to 3 shared-cpu-1x VMs (256MB RAM each)
- 3GB storage
- 160GB outbound data transfer

### 2. Install Fly CLI

**macOS/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows (PowerShell):**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Verify installation:**
```bash
fly version
```

### 3. Authenticate

```bash
fly auth login
```

This opens your browser to complete authentication.

### 4. Domain (Optional but Recommended)

For production deployments, you'll want a custom domain:
- `yourdomain.com` - Frontend
- `admin.yourdomain.com` - Admin panel
- `api.yourdomain.com` - API

You can use Fly.io's provided domains (*.fly.dev) for testing.

## Quick Start

::: tip TL;DR
```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Create Postgres and Redis
fly postgres create --name fullstack-bun-db
fly redis create --name fullstack-bun-redis

# 4. Deploy API
cd apps/api
fly launch --no-deploy --name fullstack-bun-api
fly secrets set BETTER_AUTH_SECRET="$(openssl rand -base64 32)" --app fullstack-bun-api
fly postgres attach fullstack-bun-db --app fullstack-bun-api
fly secrets set REDIS_URL="..." --app fullstack-bun-api
fly secrets set API_BASE_URL="https://fullstack-bun-api.fly.dev" --app fullstack-bun-api
fly secrets set FE_BASE_URL="https://fullstack-bun-frontend.fly.dev" --app fullstack-bun-api
fly secrets set CORS_ALLOWLISTED_ORIGINS="https://fullstack-bun-frontend.fly.dev,https://fullstack-bun-admin.fly.dev" --app fullstack-bun-api
fly deploy --config fly.toml

# 5. Deploy Frontend (update build args with your API URL)
cd ../frontend
fly launch --no-deploy --name fullstack-bun-frontend
fly deploy --config fly.toml --build-arg VITE_API_BASE_URL=https://fullstack-bun-api.fly.dev --build-arg VITE_ADMIN_URL=https://fullstack-bun-admin.fly.dev

# 6. Deploy Admin
cd ../admin
fly launch --no-deploy --name fullstack-bun-admin
fly deploy --config fly.toml --build-arg VITE_API_BASE_URL=https://fullstack-bun-api.fly.dev --build-arg VITE_FRONTEND_URL=https://fullstack-bun-frontend.fly.dev
```
:::

## Database & Redis Setup

You have two options for databases: Fly-managed or external providers.

### Option A: Fly-managed (Recommended)

#### Create Postgres Cluster

```bash
fly postgres create --name fullstack-bun-db
```

**Prompts:**
- **Region:** Choose closest to your users (e.g., `iad` for US East, `lhr` for London)
- **Configuration:** Start with `Development - Single node, 1x shared CPU, 256MB RAM, 1GB disk` for testing
- **Scale:** Upgrade to HA configuration for production

**Note the connection details** - you'll need them later.

#### Create Redis

```bash
fly redis create --name fullstack-bun-redis
```

**Prompts:**
- **Region:** Same as your Postgres (minimize latency)
- **Plan:** Start with free tier, upgrade as needed

**Copy the Redis URL** - you'll use it in the next step.

#### Attach Database to API

This automatically sets the `DATABASE_URL` secret:

```bash
fly postgres attach fullstack-bun-db --app fullstack-bun-api
```

#### Set Redis URL

```bash
fly secrets set REDIS_URL="redis://default:password@fullstack-bun-redis.flycast:6379" --app fullstack-bun-api
```

Replace with the URL from the creation step.

::: tip Flycast Internal Networking
Fly.io uses `.flycast` domains for private networking between apps. This keeps database traffic off the public internet and reduces latency.
:::

### Option B: External Providers

Use external managed services for databases:

#### Supabase (Postgres) + Upstash (Redis)

**Supabase:**
1. Create project at [supabase.com](https://supabase.com)
2. Copy connection string from Settings → Database
3. Set: `fly secrets set DATABASE_URL="postgresql://..." --app fullstack-bun-api`

**Upstash:**
1. Create database at [upstash.com](https://upstash.com)
2. Copy Redis URL from dashboard
3. Set: `fly secrets set REDIS_URL="redis://..." --app fullstack-bun-api`

#### Railway

1. Create project at [railway.app](https://railway.app)
2. Add Postgres and Redis services
3. Copy connection strings
4. Set secrets as above

::: warning Connection Limits
Free tiers have connection limits. For production, use Fly-managed databases or paid external plans.
:::

## Application Deployment

### API Deployment

The API requires the most configuration as it handles authentication, WebSockets, and database connections.

#### 1. Create App

From the monorepo root:

```bash
fly launch --no-deploy --name fullstack-bun-api --config apps/api/fly.toml
```

**Prompts:**
- **Region:** Choose primary region (e.g., `iad`)
- **Postgres:** Skip if already created
- **Redis:** Skip if already created
- **Deploy now:** No (we need to set secrets first)

#### 2. Set Secrets

::: warning Never Commit Secrets
Secrets should never be in version control. Use `fly secrets set` or import from a `.env` file.
:::

**Required secrets:**

```bash
# Authentication
fly secrets set BETTER_AUTH_SECRET="$(openssl rand -base64 32)" --app fullstack-bun-api

# Database (if not using fly postgres attach)
fly secrets set DATABASE_URL="postgresql://user:pass@host:port/db" --app fullstack-bun-api

# Redis (always required)
fly secrets set REDIS_URL="redis://default:pass@host:6379" --app fullstack-bun-api

# URLs - update with your actual domains
fly secrets set API_BASE_URL="https://fullstack-bun-api.fly.dev" --app fullstack-bun-api
fly secrets set FE_BASE_URL="https://fullstack-bun-frontend.fly.dev" --app fullstack-bun-api
fly secrets set CORS_ALLOWLISTED_ORIGINS="https://fullstack-bun-frontend.fly.dev,https://fullstack-bun-admin.fly.dev" --app fullstack-bun-api

# Email (SMTP)
fly secrets set SMTP_HOST="smtp.gmail.com" --app fullstack-bun-api
fly secrets set SMTP_PORT="587" --app fullstack-bun-api
fly secrets set SMTP_USER="your-email@gmail.com" --app fullstack-bun-api
fly secrets set SMTP_PASSWORD="your-app-password" --app fullstack-bun-api
fly secrets set SMTP_FROM="Fullstack Bun <noreply@example.com>" --app fullstack-bun-api

# Metrics endpoint security (recommended for production)
fly secrets set METRICS_API_KEY="$(openssl rand -base64 32)" --app fullstack-bun-api
```

**Optional OAuth secrets:**

```bash
# GitHub OAuth
fly secrets set GITHUB_CLIENT_ID="your-github-client-id" --app fullstack-bun-api
fly secrets set GITHUB_CLIENT_SECRET="your-github-client-secret" --app fullstack-bun-api
```

::: tip Bulk Import
Set multiple secrets from a file:
```bash
fly secrets import --app fullstack-bun-api < secrets.txt
```

Format: `KEY=value` (one per line)
:::

#### 3. Deploy

```bash
fly deploy --app fullstack-bun-api --config apps/api/fly.toml
```

This will:
1. Build the Docker image from `apps/api/Dockerfile`
2. Run database migrations via release command (`bun --filter=api run db:migrate`)
3. Start 2 API instances (configured in fly.toml)
4. Run health checks on `/health` endpoint

**Monitor deployment:**

```bash
fly logs --app fullstack-bun-api
```

**Check status:**

```bash
fly status --app fullstack-bun-api
```

#### 4. Verify Health

```bash
curl https://fullstack-bun-api.fly.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "ok",
    "redis": "ok"
  }
}
```

### Frontend Deployment

#### 1. Create App

```bash
fly launch --no-deploy --name fullstack-bun-frontend --config apps/frontend/fly.toml
```

#### 2. Update Build Args

Edit `apps/frontend/fly.toml` and update the `[build.args]` section with your API URL:

```toml
[build.args]
  VITE_API_BASE_URL = 'https://fullstack-bun-api.fly.dev'  # Or custom domain
  VITE_ADMIN_URL = 'https://fullstack-bun-admin.fly.dev'
```

Alternatively, pass build args during deployment:

```bash
fly deploy --app fullstack-bun-frontend --config apps/frontend/fly.toml \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  --build-arg VITE_ADMIN_URL=https://admin.yourdomain.com
```

::: warning Build Args vs Secrets
`VITE_*` variables are **build arguments**, not runtime secrets. They're compiled into the JavaScript bundle at build time. If you change them, you must rebuild and redeploy.
:::

#### 3. Deploy

```bash
fly deploy --app fullstack-bun-frontend --config apps/frontend/fly.toml
```

#### 4. Verify

```bash
curl -I https://fullstack-bun-frontend.fly.dev
```

Should return `200 OK` with HTML content.

### Admin Deployment

Admin deployment is nearly identical to frontend:

#### 1. Create App

```bash
fly launch --no-deploy --name fullstack-bun-admin --config apps/admin/fly.toml
```

#### 2. Update Build Args

Edit `apps/admin/fly.toml`:

```toml
[build.args]
  VITE_API_BASE_URL = 'https://fullstack-bun-api.fly.dev'
  VITE_FRONTEND_URL = 'https://fullstack-bun-frontend.fly.dev'
```

Or pass during deployment:

```bash
fly deploy --app fullstack-bun-admin --config apps/admin/fly.toml \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  --build-arg VITE_FRONTEND_URL=https://yourdomain.com
```

#### 3. Deploy

```bash
fly deploy --app fullstack-bun-admin --config apps/admin/fly.toml
```

::: tip Cost Optimization
The admin app is configured with `min_machines_running = 0` to scale down when idle, saving costs. It will automatically start when accessed.
:::

## Environment Variables & Secrets

### Environment Variables Summary

| Variable | App | Type | Description |
|----------|-----|------|-------------|
| `PORT` | All | Env | Internal port (3001 for API, 5173 for frontend, 5175 for admin) |
| `NODE_ENV` | All | Env | Always `production` |
| `ENABLE_DISTRIBUTED_CHAT` | API | Env | Enable horizontal scaling (`true`) |
| `DATABASE_URL` | API | Secret | PostgreSQL connection string |
| `REDIS_URL` | API | Secret | Redis connection string |
| `BETTER_AUTH_SECRET` | API | Secret | Auth secret key (32+ chars) |
| `API_BASE_URL` | API | Secret | Public API URL |
| `FE_BASE_URL` | API | Secret | Frontend URL for email links |
| `CORS_ALLOWLISTED_ORIGINS` | API | Secret | Comma-separated allowed origins |
| `SMTP_HOST` | API | Secret | SMTP server hostname |
| `SMTP_PORT` | API | Secret | SMTP port (usually 587) |
| `SMTP_USER` | API | Secret | SMTP username |
| `SMTP_PASSWORD` | API | Secret | SMTP password |
| `SMTP_FROM` | API | Secret | From email address |
| `METRICS_API_KEY` | API | Secret | Metrics endpoint auth key (optional) |
| `GITHUB_CLIENT_ID` | API | Secret | GitHub OAuth ID (optional) |
| `GITHUB_CLIENT_SECRET` | API | Secret | GitHub OAuth secret (optional) |
| `VITE_API_BASE_URL` | Frontend, Admin | Build Arg | API URL (compiled at build time) |
| `VITE_ADMIN_URL` | Frontend | Build Arg | Admin URL (compiled at build time) |
| `VITE_FRONTEND_URL` | Admin | Build Arg | Frontend URL (compiled at build time) |

### Setting Secrets

**Single secret:**
```bash
fly secrets set KEY=value --app app-name
```

**Multiple secrets:**
```bash
fly secrets set KEY1=value1 KEY2=value2 --app app-name
```

**From file:**
```bash
fly secrets import --app app-name < secrets.txt
```

**View secret names (not values):**
```bash
fly secrets list --app app-name
```

**Unset secret:**
```bash
fly secrets unset KEY --app app-name
```

::: warning Secret Changes Trigger Restarts
Setting or unsetting secrets triggers a rolling restart of your app.
:::

## Custom Domains & SSL

Fly.io provides free SSL certificates via Let's Encrypt.

### 1. Add Certificate

```bash
fly certs create api.yourdomain.com --app fullstack-bun-api
fly certs create yourdomain.com --app fullstack-bun-frontend
fly certs create admin.yourdomain.com --app fullstack-bun-admin
```

### 2. Configure DNS

Fly.io will provide DNS targets. Add CNAME or A/AAAA records:

**Check certificate status:**
```bash
fly certs show api.yourdomain.com --app fullstack-bun-api
```

**For CNAME:**
```
CNAME api.yourdomain.com → fullstack-bun-api.fly.dev
```

**For A/AAAA (apex domain):**
```bash
fly ips list --app fullstack-bun-frontend
```

Add the IPv4 and IPv6 addresses to your DNS:
```
A    yourdomain.com → <IPv4>
AAAA yourdomain.com → <IPv6>
```

::: tip DNS Propagation
DNS changes can take 5-60 minutes to propagate. Check status with `fly certs check`.
:::

### 3. Update Build Args and Secrets

After adding custom domains, update all references:

**API secrets:**
```bash
fly secrets set API_BASE_URL="https://api.yourdomain.com" --app fullstack-bun-api
fly secrets set FE_BASE_URL="https://yourdomain.com" --app fullstack-bun-api
fly secrets set CORS_ALLOWLISTED_ORIGINS="https://yourdomain.com,https://admin.yourdomain.com" --app fullstack-bun-api
```

**Frontend build args (requires rebuild):**
```bash
fly deploy --app fullstack-bun-frontend --config apps/frontend/fly.toml \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  --build-arg VITE_ADMIN_URL=https://admin.yourdomain.com
```

**Admin build args (requires rebuild):**
```bash
fly deploy --app fullstack-bun-admin --config apps/admin/fly.toml \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  --build-arg VITE_FRONTEND_URL=https://yourdomain.com
```

## Scaling & Optimization

### Horizontal Scaling (API)

The API supports horizontal scaling with Redis pub/sub for WebSocket message broadcasting.

#### Enable Distributed Mode

Distributed mode is enabled by default in `apps/api/fly.toml`:

```toml
[env]
  ENABLE_DISTRIBUTED_CHAT = 'true'
```

This allows multiple API instances to share WebSocket connections via Redis.

::: tip
See the [Horizontal Scaling Guide](/reference/horizontal-scaling) for detailed architecture and implementation details.
:::

#### Scale to Multiple Instances

```bash
# Scale to 3 instances
fly scale count 3 --app fullstack-bun-api

# Check current scale
fly status --app fullstack-bun-api
```

#### Multi-Region Deployment

Run API instances in multiple regions for global low latency:

```bash
# Add regions
fly regions add iad lhr syd --app fullstack-bun-api

# Scale to 6 instances (2 per region)
fly scale count 6 --app fullstack-bun-api

# View regions
fly regions list --app fullstack-bun-api
```

::: warning Keep Redis Close
For best pub/sub performance, keep API instances in the same region as Redis. Multi-region Redis adds latency (50-200ms).
:::

#### Verify Distributed Mode

Check the `/metrics` endpoint to see active instances:

```bash
curl -H "Authorization: Bearer $METRICS_API_KEY" https://api.yourdomain.com/metrics
```

Response should show multiple instances:
```json
{
  "cluster": {
    "totalInstances": 3,
    "activeInstances": 3,
    "instances": [
      {
        "instanceId": "api-abc123",
        "connectedClients": 45,
        "uptime": 3600,
        "region": "iad"
      },
      // ...more instances
    ]
  }
}
```

### Auto-Scaling Configuration

Fly.io supports auto-scaling based on metrics. Create `fly.toml` auto-scaling rules:

```toml
[[services]]
  # ... existing config ...

  [[services.autoscaling]]
    min_count = 2
    max_count = 10

    [[services.autoscaling.rules]]
      type = "connection"
      hard_limit = 1000
      soft_limit = 800
```

Or configure via CLI:

```bash
fly autoscale set --app fullstack-bun-api --min-count 2 --max-count 10
```

### Vertical Scaling

Increase VM resources:

```bash
# List available VM sizes
fly platform vm-sizes

# Scale to performance-1x (2GB RAM, dedicated CPU)
fly scale vm performance-1x --app fullstack-bun-api

# Or update fly.toml:
```

```toml
[[vm]]
  memory = '2gb'
  cpu_kind = 'performance'
  cpus = 2
```

### Cost Optimization Tips

1. **Admin panel:** Keep `min_machines_running = 0` (already configured)
2. **Use shared CPUs:** Adequate for most workloads, much cheaper
3. **Single region:** Multi-region deployment costs more
4. **Right-size VMs:** Start small, scale up based on metrics
5. **Suspend idle apps:** Frontend/admin can use `auto_stop_machines = 'suspend'`
6. **Monitor usage:** `fly status` and `fly dashboard` show resource usage

## Monitoring & Operations

### View Logs

**Real-time logs:**
```bash
fly logs --app fullstack-bun-api
```

**Filter by instance:**
```bash
fly logs --app fullstack-bun-api --instance <machine-id>
```

**Show last 100 lines:**
```bash
fly logs --app fullstack-bun-api -n 100
```

### Access Metrics Endpoint

```bash
curl -H "Authorization: Bearer $METRICS_API_KEY" https://api.yourdomain.com/metrics
```

Or login as admin and visit `/metrics` in your browser.

**Metrics include:**
- Active instances and their health
- Connected WebSocket clients per instance
- Cluster topology
- Uptime and performance stats

### SSH into Machines

```bash
# List machines
fly machines list --app fullstack-bun-api

# SSH into specific machine
fly ssh console --app fullstack-bun-api --machine <machine-id>

# SSH into any available machine
fly ssh console --app fullstack-bun-api
```

Inside the container:
```bash
# Check app files
ls -la /app/apps/api

# View environment
env | grep DATABASE_URL

# Check processes
ps aux

# Test Redis connection
bun --filter=api run repl
```

### Database Operations

#### View Backups

```bash
fly postgres list-backups --app fullstack-bun-db
```

#### Connect to Database

```bash
fly postgres connect --app fullstack-bun-db
```

Then run SQL:
```sql
\dt -- List tables
SELECT * FROM users LIMIT 10;
```

#### Run Migrations Manually

Migrations run automatically via the release command, but you can run them manually:

```bash
fly ssh console --app fullstack-bun-api
bun --filter=api run db:migrate
```

### Redis Operations

```bash
# Connect to Redis
fly redis connect --app fullstack-bun-redis

# Inside Redis CLI
PING
KEYS *
GET key
```

### Health Check Monitoring

View health check status:

```bash
fly checks list --app fullstack-bun-api
```

Health checks fail during:
- Database connection issues
- Redis connection issues
- Graceful shutdown (returns 503)

## CI/CD Integration

Automate deployments with GitHub Actions.

### 1. Generate Deploy Token

```bash
fly tokens create deploy --app fullstack-bun-api
fly tokens create deploy --app fullstack-bun-frontend
fly tokens create deploy --app fullstack-bun-admin
```

### 2. Add Tokens to GitHub Secrets

In your GitHub repo:
- Settings → Secrets and variables → Actions → New repository secret

Add:
- `FLY_API_TOKEN_API` - API deploy token
- `FLY_API_TOKEN_FRONTEND` - Frontend deploy token
- `FLY_API_TOKEN_ADMIN` - Admin deploy token

### 3. Create Workflow

`.github/workflows/deploy-flyio.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-api:
    name: Deploy API
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy API
        run: flyctl deploy --config apps/api/fly.toml --app fullstack-bun-api
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN_API }}

  deploy-frontend:
    name: Deploy Frontend
    runs-on: ubuntu-latest
    needs: deploy-api # Wait for API first
    steps:
      - uses: actions/checkout@v4

      - uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy Frontend
        run: |
          flyctl deploy --config apps/frontend/fly.toml --app fullstack-bun-frontend \
            --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
            --build-arg VITE_ADMIN_URL=https://admin.yourdomain.com
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN_FRONTEND }}

  deploy-admin:
    name: Deploy Admin
    runs-on: ubuntu-latest
    needs: deploy-api
    steps:
      - uses: actions/checkout@v4

      - uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy Admin
        run: |
          flyctl deploy --config apps/admin/fly.toml --app fullstack-bun-admin \
            --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
            --build-arg VITE_FRONTEND_URL=https://yourdomain.com
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN_ADMIN }}
```

### 4. Deploy on Push

Now every push to `main` automatically deploys all apps.

::: tip Conditional Deployments
Use path filters to only deploy changed apps:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'
      - 'packages/**'
```
:::

## Troubleshooting

### Database Connection Issues

**Symptoms:**
- Health checks failing
- Logs show "database connection error"

**Solutions:**

1. Check `DATABASE_URL` secret:
```bash
fly secrets list --app fullstack-bun-api
```

2. Verify Postgres is healthy:
```bash
fly status --app fullstack-bun-db
```

3. Test connection:
```bash
fly ssh console --app fullstack-bun-api
bun --filter=api run db:studio
```

4. Check connection string format:
```
postgresql://user:password@host:port/database?sslmode=disable
```

### Redis Pub/Sub Not Working

**Symptoms:**
- Messages only reach users on same instance
- Metrics show `totalInstances` but `activeInstances` is less

**Solutions:**

1. Verify `REDIS_URL` secret:
```bash
fly secrets list --app fullstack-bun-api
```

2. Test Redis connection:
```bash
fly redis connect --app fullstack-bun-redis
PING # Should return PONG
```

3. Check distributed mode is enabled:
```bash
fly ssh console --app fullstack-bun-api
env | grep ENABLE_DISTRIBUTED_CHAT # Should be 'true'
```

4. Review API logs for pub/sub errors:
```bash
fly logs --app fullstack-bun-api | grep -i redis
```

### Health Checks Failing

**Symptoms:**
- Machines showing as unhealthy
- Requests timing out

**Solutions:**

1. Check health endpoint directly:
```bash
curl https://fullstack-bun-api.fly.dev/health
```

2. Increase grace period in `fly.toml`:
```toml
[[services.http_checks]]
  grace_period = '20s' # Increase if migrations take long
```

3. View health check logs:
```bash
fly logs --app fullstack-bun-api | grep health
```

4. Verify `/health` endpoint code is working:
   - Should check database with `SELECT 1`
   - Should check Redis with `isRedisReady()`
   - Returns 503 during graceful shutdown

### Build Failures

**Symptoms:**
- `fly deploy` fails during Docker build

**Common causes:**

1. **Docker context issues** - Builds must run from monorepo root:
```bash
# ✗ Wrong
cd apps/api && fly deploy

# ✓ Correct
fly deploy --config apps/api/fly.toml
```

2. **Build arg configuration:**
```bash
# Check build args match Dockerfile ARG declarations
grep ARG apps/frontend/Dockerfile
```

3. **Dependency installation failures:**
```bash
# Test build locally first
docker build -f apps/api/Dockerfile --target production .
```

4. **Out of memory during build:**
   - Increase builder VM size temporarily
   - Or build locally and `fly deploy --image`

### WebSocket Connections Dropping

**Symptoms:**
- Chat disconnects frequently
- Real-time features stop working

**Solutions:**

1. Verify `auto_stop_machines = 'off'` for API:
```toml
[[services]]
  auto_stop_machines = 'off' # Required for WebSockets
```

2. Check CORS configuration:
```bash
fly secrets list --app fullstack-bun-api | grep CORS
```

Should include frontend/admin URLs.

3. Monitor connection in browser console:
```javascript
// Should stay connected
console.log(chatSocket.readyState); // 1 = OPEN
```

4. Review API logs for disconnect patterns:
```bash
fly logs --app fullstack-bun-api | grep -i "websocket\|disconnect"
```

### Rollback Procedure

**View release history:**
```bash
fly releases --app fullstack-bun-api
```

**Rollback to previous version:**
```bash
fly releases rollback <version> --app fullstack-bun-api
```

**Example:**
```bash
# View last 10 releases
fly releases --app fullstack-bun-api -n 10

# Rollback to version 42
fly releases rollback 42 --app fullstack-bun-api
```

::: warning Database Migrations
Rollbacks don't revert database migrations. If a migration breaks the app, you may need to manually revert it:

```bash
fly ssh console --app fullstack-bun-api
bun --filter=api run db:rollback
```
:::

### Build Args Not Updating

**Symptoms:**
- Frontend still shows old API URL
- Environment variables unchanged after redeploy

**Cause:**
Build args are compiled at build time, not runtime.

**Solution:**
Force rebuild with updated args:

```bash
fly deploy --app fullstack-bun-frontend --config apps/frontend/fly.toml \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  --build-arg VITE_ADMIN_URL=https://admin.yourdomain.com \
  --no-cache # Force fresh build
```

Or update `fly.toml` and redeploy:

```toml
[build.args]
  VITE_API_BASE_URL = 'https://api.yourdomain.com'
```

## Cost Estimation

### Free Tier

Fly.io's free tier includes:
- **3 shared-cpu-1x VMs** (256MB RAM each)
- **3GB persistent storage**
- **160GB outbound data transfer per month**

**Can you run fullstack-bun on free tier?**

Minimal setup (1 API + 1 frontend + external DB/Redis):
- ✓ Fits within free tier
- ✗ No high availability (single API instance)
- ✗ External services may have costs

### Production Scale Estimate

**Recommended production setup:**

| Service | VMs | Size | Cost/month |
|---------|-----|------|------------|
| API | 2 | shared-cpu-1x, 512MB | $8.28 |
| Frontend | 1 | shared-cpu-1x, 256MB | $3.45 |
| Admin | 0-1 | shared-cpu-1x, 256MB | $0-3.45 |
| Postgres | 1 | shared-cpu-1x, 256MB + 10GB | $9.51 |
| Redis | 1 | 250MB Eviction | $5 |
| **Total** | | | **~$26-30/month** |

**With high availability:**

| Service | VMs | Size | Cost/month |
|---------|-----|------|------------|
| API | 4 (multi-region) | shared-cpu-1x, 512MB | $16.56 |
| Frontend | 2 | shared-cpu-1x, 256MB | $6.90 |
| Admin | 1 | shared-cpu-1x, 256MB | $3.45 |
| Postgres | 3 (HA cluster) | shared-cpu-1x, 256MB + 10GB | $28.53 |
| Redis | 2 (HA) | 500MB Eviction | $20 |
| **Total** | | | **~$75-80/month** |

**Additional costs:**
- IPv4 addresses: $2/app/month (if needed)
- Outbound data: $0.02/GB over 160GB free tier
- Custom VM sizes: See [fly.io/docs/about/pricing](https://fly.io/docs/about/pricing)

### Cost Optimization Strategies

1. **Scale admin to 0** - Already configured with `min_machines_running = 0`
2. **Use shared CPUs** - Adequate for most workloads
3. **Single region** - Multi-region adds VM costs
4. **External databases** - Supabase/Upstash may be cheaper for low usage
5. **Monitor metrics** - Scale down if over-provisioned
6. **Suspend frontend when idle** - For low-traffic apps

::: tip Monitor Costs
View usage and costs: `fly dashboard` → Billing
:::

## Summary

You now have a fully deployed fullstack-bun application on Fly.io with:

- ✓ Horizontally scalable API with Redis pub/sub
- ✓ Static frontend and admin panels
- ✓ Managed Postgres and Redis
- ✓ SSL certificates and custom domains
- ✓ Health checks and graceful shutdown
- ✓ CI/CD pipeline with GitHub Actions

**Next steps:**

1. [Set up monitoring and alerting](https://fly.io/docs/reference/metrics/)
2. [Configure backups](https://fly.io/docs/postgres/managing/backup-and-restore/)
3. [Add custom middleware](/reference/api-routing)
4. [Review security best practices](https://fly.io/docs/reference/security/)

**Resources:**

- [Fly.io Documentation](https://fly.io/docs/)
- [Horizontal Scaling Guide](/reference/horizontal-scaling)
- [Environment Variables Reference](/reference/environment-variables)
- [Docker Guide](/docker) (for local testing)
