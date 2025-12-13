import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  type Example,
  type NewExample,
  newExampleSchema,
} from "shared/interfaces/example";
import { v4 as uuidv4 } from "uuid";
import type { LoggerMiddlewareEnv } from "../middlewares/logger";

const DB: Example[] = [
  { id: uuidv4(), message: "hello friend", postedAt: new Date().toISOString() },
  { id: uuidv4(), message: "hello world", postedAt: new Date().toISOString() },
];

const exampleRouter = new Hono<LoggerMiddlewareEnv>()
  // Return the example list at the base route so `/example` responds with `{ list: [...] }`
  .get("/", (c) =>
    c.json({
      list: DB.sort(
        (a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime(),
      ),
    }),
  )
  // Optional: expose env info at `/example/env` for debugging
  .get("/env", (c) =>
    c.json({
      message: process.env.CORS_ALLOWLISTED_ORIGINS,
    }),
  )
  .get("/special", (c) => c.json({ id: 1, name: "Special Example" }))
  .get("/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ id, name: `Example ${id}` });
  })
  .post("/", zValidator("json", newExampleSchema({})), async (c) => {
    const body = await c.req.json<NewExample>();
    c.var.logger.info(body, "Incoming body");
    DB.push({ id: uuidv4(), message: body.message, postedAt: new Date().toISOString() });
    return c.json({ success: true });
  });

export { exampleRouter };
