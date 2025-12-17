---
layout: doc
---

# Database

This project uses **PostgreSQL** with **Drizzle ORM** for database management.

## Overview

- **Database:** PostgreSQL 15
- **ORM:** Drizzle ORM
- **Schema Management:** better-auth generates auth tables automatically
- **Migrations:** Drizzle Kit

## Quick Start

### 1. Install Dependencies

Dependencies are already installed if you've set up the project. Otherwise:

```bash
cd apps/api
bun add drizzle-orm postgres
bun add -d drizzle-kit
```

### 2. Set Up Database

**Local Development (Docker):**

```bash
# Start PostgreSQL via Docker Compose
docker-compose up postgres -d

# Check database is running
docker ps
```

**Manual Setup:**

Install PostgreSQL 15 and create a database:

```sql
CREATE DATABASE mydatabase;
```

### 3. Configure Environment

Create `apps/api/.env` (copy from `.env.example`):

```txt
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydatabase"
```

For Docker, the host is `postgres`. For local PostgreSQL, use `localhost`.

## Drizzle Kit Commands

### Generate Migrations

```bash
bunx drizzle-kit generate:pg
```

Generates SQL migration files based on schema changes.

### Push Schema

```bash
bunx drizzle-kit push:pg
```

Pushes schema changes directly to the database without migrations (good for development).

### View Database

```bash
bunx drizzle-kit studio
```

Opens Drizzle Studio - a database GUI at `http://localhost:4983`.

## Configuration

### Drizzle Config

The Drizzle configuration is at `apps/api/drizzle.config.ts`:

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
} satisfies Config;
```

### Database Client

The database client is at `apps/api/src/db/client.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "";
const queryClient = connectionString ? postgres(connectionString) : ({} as any);

export const db = drizzle(queryClient);
```

## Local Development

### Using Docker

The recommended approach for local development:

```bash
# Start database
docker-compose up postgres -d

# Check it's running
docker logs myapp-postgres

# Connect to database
docker exec -it myapp-postgres psql -U postgres -d mydatabase
```

### Connection String

```txt
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydatabase"
```

- **User:** `postgres`
- **Password:** `postgres`
- **Host:** `localhost` (or `postgres` when running in Docker network)
- **Port:** `5432`
- **Database:** `mydatabase`

## Production

### Database Setup

1. **Provision PostgreSQL**: Use a managed service like:
   - [AWS RDS](https://aws.amazon.com/rds/postgresql/)
   - [Digital Ocean](https://www.digitalocean.com/products/managed-databases-postgresql)
   - [Supabase](https://supabase.com/)
   - [Neon](https://neon.tech/)

2. **Get Connection String**:
   ```txt
   postgresql://username:password@host:port/database?sslmode=require
   ```

3. **Set Environment Variable**:
   ```bash
   export DATABASE_URL="your-production-connection-string"
   ```

4. **Push Schema**:
   ```bash
   cd apps/api
   bunx drizzle-kit push:pg
   ```

### Security Considerations

- ✅ Use SSL/TLS connections (`?sslmode=require`)
- ✅ Use strong, random passwords
- ✅ Restrict database access to application servers only
- ✅ Enable connection pooling
- ✅ Set up regular backups
- ✅ Monitor database performance and logs
- ✅ Never commit `DATABASE_URL` to version control

## Troubleshooting

### Can't Connect to Database

1. **Check PostgreSQL is running**:
   ```bash
   docker ps | grep postgres
   ```

2. **Check connection string**:
   - Verify username, password, host, port, database name
   - For Docker: use `postgres` as host
   - For local: use `localhost` as host

3. **Check firewall**: Ensure port 5432 is open

### Schema Not Creating

1. **Check DATABASE_URL is set**:
   ```bash
   echo $DATABASE_URL
   ```

2. **Run push command**:
   ```bash
   bunx drizzle-kit push:pg
   ```

3. **Check for errors** in the output

### Data Not Persisting

1. **Check Docker volumes**:
   ```bash
   docker volume ls
   ```

2. **Restart containers**:
   ```bash
   docker-compose restart postgres
   ```

## Migrations vs Push

### Use `push` for:
- ✅ Local development
- ✅ Rapid prototyping
- ✅ Quick schema changes

### Use `generate` + migrations for:
- ✅ Production deployments
- ✅ Team collaboration
- ✅ Tracking schema history
- ✅ Rollback capability

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [better-auth Database Guide](https://www.better-auth.com/docs/concepts/database)
