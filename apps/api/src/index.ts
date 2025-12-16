import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { loggerMiddleware, requestLoggerMiddleware } from "./middlewares/logger";
import { exampleRouter } from "./routers/example-router";

const app = new Hono();

const allowedOrigins =
  process.env.CORS_ALLOWLISTED_ORIGINS?.split(",").map((origin) =>
    origin.trim().replace(/^["']|["']$/g, ""),
  ) || [];

const routes = app
  .use(loggerMiddleware())
  .use(
    "*",
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  )
  .route("/example", exampleRouter)
  .on(["POST", "GET", "OPTIONS"], "/auth/*", async (c) => {
    const response = await auth.handler(c.req.raw);
    const { method, path } = c.req;
    const { status } = response;
    c.get("logger").info(`${status} - ${method} - ${path}`);
    return response;
  })
  .use(requestLoggerMiddleware());

export type AppType = typeof routes;

export default {
  port: process.env.PORT || 3001,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
