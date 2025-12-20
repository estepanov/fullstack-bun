import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { websocket } from "hono/bun";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { db } from "./db/client";
import { env, isDevelopmentEnv } from "./env";
import { auth } from "./lib/auth";
import { isRedisReady } from "./lib/redis";
import { loggerMiddleware, requestLogFormat } from "./middlewares/logger";
import { adminRouter } from "./routers/admin-router";
import { chatRouter } from "./routers/chat-router";
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
    const debugObj = {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : undefined,
      errorStack: error instanceof Error ? error.stack : undefined,
      errorCause: error instanceof Error ? error.cause : undefined,
      url: c.req.url,
      userAgent: c.req.header("User-Agent"),
    };
    if (error instanceof HTTPException) {
      logger.error("------ HTTPException ------\n", debugObj, "------------");
      return error.getResponse();
    }
    logger.error("------ UNCAUGHT ERROR ------\n", debugObj, "------------");
    return c.newResponse(null, { status: 500 });
  });

const appWithRoutes = isDevelopmentEnv()
  ? baseApp
      .route("example", exampleRouter)
      .route("admin", adminRouter)
      .route("chat", chatRouter)
  : baseApp.route("admin", adminRouter).route("chat", chatRouter);

const routes = appWithRoutes
  .get("/health", async (c) => {
    const logger = c.get("logger") || console;

    try {
      // Check database connection
      const dbHealthy = await db
        .execute(sql`SELECT 1`)
        .then(() => true)
        .catch(() => false);

      // Check Redis connection
      const redisHealthy = await isRedisReady();

      const allHealthy = dbHealthy && redisHealthy;

      return c.json(
        {
          status: allHealthy ? "ok" : "degraded",
          timestamp: new Date().toISOString(),
          services: {
            database: dbHealthy ? "ok" : "error",
            redis: redisHealthy ? "ok" : "error",
          },
        },
        allHealthy ? 200 : 503,
      );
    } catch (error) {
      logger.error("Health check failed:", error);
      return c.json(
        {
          status: "error",
          timestamp: new Date().toISOString(),
          services: {
            database: "unknown",
            redis: "unknown",
          },
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
  websocket,
};
