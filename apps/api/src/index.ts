import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { db } from "./db/client";
import { env, isDevelopmentEnv } from "./env";
import { auth } from "./lib/auth";
import { loggerMiddleware, requestLogFormat } from "./middlewares/logger";
import { adminRouter } from "./routers/admin-router";
import { exampleRouter } from "./routers/example-router";

const app = new Hono();

const baseApp = app
  .use(loggerMiddleware())
  .use(
    "*",
    cors({
      origin: env.CORS_ALLOWLISTED_ORIGINS,
      credentials: true,
    }),
  )
  .onError((error, c) => {
    const logger = c.get("logger") || console;
    const debugObj = { error, url: c.req.url, userAgent: c.req.header("User-Agent") };
    if (error instanceof HTTPException) {
      logger.error("------ HTTPException ------\n", debugObj, "------------");
      return error.getResponse();
    }
    logger.error("------ UNCAUGHT ERROR ------\n", debugObj, "------------");
    return c.newResponse(null, { status: 500 });
  });

const appWithRoutes = isDevelopmentEnv()
  ? baseApp.route("example", exampleRouter).route("admin", adminRouter)
  : baseApp.route("admin", adminRouter);

const routes = appWithRoutes
  .get("/health", async (c) => {
    try {
      // Check database connection
      await db.execute(sql`SELECT 1`);
      return c.json({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const logger = c.get("logger") || console;
      logger.error("Health check failed:", error);
      return c.json(
        {
          status: "error",
          timestamp: new Date().toISOString(),
        },
        503,
      );
    }
  })
  .on(["POST", "GET", "OPTIONS"], "/auth/*", async (c) => {
    const response = await auth.handler(c.req.raw);
    const { method, url } = c.req;
    const { status } = response;
    c.get("logger").info(
      requestLogFormat({
        status,
        method,
        url,
      }),
    );
    return response;
  });

export type AppType = typeof routes;

export default {
  port: env.PORT,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
