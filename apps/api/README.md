To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

open <http://localhost:3001>


## logging

Out of the box, every request/response is logged.
You can also pull the logger context via `c.var.logger` like:

```ts
c.var.logger.info(body, 'Incoming body')
```

We use pino for the logging. The base logger is `apps/api/src/utils/logger.ts` and the middleware that prints the req/res and is available via context is setup in `apps/api/src/middlewares/logger.ts`
