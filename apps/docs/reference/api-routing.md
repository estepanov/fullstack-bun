---
layout: doc
---

# API Routing

This project uses [Hono](https://hono.dev) as the backend framework. 
You can add or edit API routes in `apps/api/src/index.ts`. 

In order to get hono client types to be passed across packages at build time, there is a new `build:types` command in api package.

## Basic Route Structure

```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Apply middleware
app.use('*', cors({
  origin: process.env.CORS_ALLOWLISTED_ORIGINS?.split(',') || [],
}));

// Define routes
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Group routes
const users = new Hono();
users.get('/', (c) => c.json({ users: [] }));
users.post('/', (c) => c.json({ message: 'User created' }));

app.route('/api/users', users);
```

## Middleware

Hono provides a powerful middleware system. Here are some common middleware patterns:

```ts
// Authentication middleware
const auth = async (c, next) => {
  const token = c.req.header('Authorization');
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  // Verify token
  await next();
};

// Apply to specific routes
app.use('/api/protected/*', auth);

// Apply to all routes
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});
```

## Request Validation

Hono works well with Zod for request validation:

```ts
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

app.post('/api/users', zValidator('json', userSchema), (c) => {
  const data = c.req.valid('json');
  // Process validated data
  return c.json({ message: 'User created', data });
});
```

## Error Handling

```ts
// Global error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Not found handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});
```

## Type Generation

To generate types for your API routes:

1. Run `bun run build:types` in the API package
2. Import the generated types in your frontend code:

```ts
import type { Api } from 'api';
```

## Best Practices

- Group related routes using Hono's routing system
- Use middleware for cross-cutting concerns
- Validate all incoming requests with Zod
- Implement proper error handling
- Keep route handlers focused and delegate business logic to services
- Use TypeScript for type safety across the stack

