import { Hono } from "hono";
import { cors } from "hono/cors";
import { loggerMiddleware } from "./middlewares/logger";
import { exampleRouter } from "./routers/example-router";

const app = new Hono();

const allowedOrigins = process.env.CORS_ALLOWLISTED_ORIGINS?.split(",") || [];

const routes = app
  .use(loggerMiddleware())
  .use(
    "*",
    cors({
      origin: allowedOrigins,
    }),
  )
  .route("/example", exampleRouter);

export type AppType = typeof routes;

export default {
  port: process.env.PORT || 3001,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
