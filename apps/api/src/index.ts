import { Hono } from "hono";
import { cors } from "hono/cors";
import { env, isDevelopmentEnv } from "./env";
import { auth } from "./lib/auth";
import { loggerMiddleware, requestLoggerMiddleware } from "./middlewares/logger";
import { exampleRouter } from "./routers/example-router";

const app = new Hono();

const baseApp = app.use(loggerMiddleware()).use(
  "*",
  cors({
    origin: env.CORS_ALLOWLISTED_ORIGINS,
    credentials: true,
  }),
);

const appWithRoutes = isDevelopmentEnv()
  ? baseApp.route("example", exampleRouter)
  : baseApp;

const routes = appWithRoutes
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
  port: env.PORT,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
