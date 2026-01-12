import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { websocket } from "hono/bun";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { AUTH_CONFIG } from "shared/config/auth";
import { db } from "./db/client";
import { env, isDevelopmentEnv } from "./env";
import { auth } from "./lib/auth";
import { chatManager } from "./lib/chat-manager";
import { chatPresenceService } from "./lib/chat-presence";
import { ChatPubSubManager } from "./lib/chat-pubsub";
import { instanceHeartbeat } from "./lib/instance-heartbeat";
import {
  getRedisPubSubPublisher,
  getRedisPubSubSubscriber,
  isRedisReady,
  redis,
} from "./lib/redis";
import { loggerMiddleware, requestLogFormat } from "./middlewares/logger";
import { requireMetricsAuth } from "./middlewares/require-metrics-auth";
import { adminRouter } from "./routers/admin-router";
import { chatRouter } from "./routers/chat-router";
import { exampleRouter } from "./routers/example-router";
import { userRouter } from "./routers/user-router";
import { appLogger } from "./utils/logger";

// Global flag for graceful shutdown
let isShuttingDown = false;

// Module-level reference to pub/sub manager for graceful shutdown
let chatPubSubManager: ChatPubSubManager | null = null;

// Initialize horizontal scaling if enabled
if (env.ENABLE_DISTRIBUTED_CHAT) {
	appLogger.info("Distributed chat mode enabled - initializing pub/sub");

	// Initialize presence service
	chatManager.setPresenceService(chatPresenceService);

	// Initialize pub/sub manager
	chatPubSubManager = new ChatPubSubManager(chatManager);
	chatManager.setPubSubManager(chatPubSubManager);

	// Start pub/sub manager
	chatPubSubManager.start().catch((error) => {
		appLogger.error({ error }, "Failed to start ChatPubSubManager");
		process.exit(1);
	});

	// Start instance heartbeat
	instanceHeartbeat
		.start(() => chatManager.getClientCount())
		.catch((error) => {
			appLogger.error({ error }, "Failed to start instance heartbeat");
			process.exit(1);
		});
} else {
	appLogger.info("Single-instance chat mode (distributed mode disabled)");
}

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
      errorMessage:
        // biome-ignore lint/suspicious/noExplicitAny: test
        (error as unknown as any)?.message ? error.message : String(error),
      errorName:
        // biome-ignore lint/suspicious/noExplicitAny: test
        (error as unknown as any)?.name ? error.name : undefined,
      errorStack:
        // biome-ignore lint/suspicious/noExplicitAny: test
        (error as unknown as any)?.stack ? error.stack : undefined,
      errorCause:
        // biome-ignore lint/suspicious/noExplicitAny: test
        (error as unknown as any)?.cause ? error.cause : undefined,
      url: c.req.url,
      userAgent: c.req.header("User-Agent"),
    };
    if (error instanceof HTTPException) {
      logger.error("Hono Error Handler");
      logger.error(debugObj);
      return error.getResponse();
    }
    logger.error("Uncaught error");
    logger.error(debugObj);
    return c.newResponse(null, { status: 500 });
  });

const appWithRoutes = isDevelopmentEnv()
  ? baseApp
      .route("example", exampleRouter)
      .route("admin", adminRouter)
      .route("chat", chatRouter)
      .route("user", userRouter)
  : baseApp
      .route("admin", adminRouter)
      .route("chat", chatRouter)
      .route("user", userRouter);

const routes = appWithRoutes
  .get("/health", async (c) => {
    const logger = c.get("logger") || console;

    // Return 503 during shutdown to remove from load balancer
    if (isShuttingDown) {
      return c.json(
        {
          status: "shutting_down",
          timestamp: new Date().toISOString(),
        },
        503,
      );
    }

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
      logger.error({ error }, "Health check failed:");
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
  .get("/metrics", requireMetricsAuth(), async (c) => {
    // Return pub/sub metrics if distributed mode is enabled
    const metrics = chatPubSubManager?.getMetrics();
    const activeInstances = env.ENABLE_DISTRIBUTED_CHAT
      ? await instanceHeartbeat.getActiveInstances()
      : [];

    return c.json({
      timestamp: new Date().toISOString(),
      instanceId: env.INSTANCE_ID || "unknown",
      distributedMode: env.ENABLE_DISTRIBUTED_CHAT,
      pubsub: metrics || null,
      chat: {
        connectedClients: chatManager.getClientCount(),
      },
      cluster: {
        activeInstances: activeInstances.length,
        instances: activeInstances,
      },
    });
  })
  .on(["POST", "GET", "OPTIONS"], `${AUTH_CONFIG.basePath}/*`, async (c) => {
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

/**
 * Graceful shutdown handler
 * Handles SIGTERM and SIGINT signals to cleanly shut down the server
 */
async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    appLogger.warn(`Shutdown already in progress, ignoring ${signal}`);
    return;
  }

  isShuttingDown = true;
  appLogger.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // 1. Stop accepting new connections (health checks will now return 503)
    appLogger.info("Health checks now returning 503 to remove from load balancer");

    // 2. Stop instance heartbeat if enabled
    if (env.ENABLE_DISTRIBUTED_CHAT) {
      appLogger.info("Stopping instance heartbeat...");
      await instanceHeartbeat.stop();
    }

    // 3. Drain WebSocket connections
    appLogger.info("Draining WebSocket connections...");
    await chatManager.shutdown();

    // 4. Stop pub/sub if enabled
    if (chatPubSubManager) {
      appLogger.info("Stopping pub/sub manager...");
      await chatPubSubManager.stop();
    }

    // 5. Close Redis connections
    appLogger.info("Closing Redis connections...");
    await redis.quit();
    if (env.ENABLE_DISTRIBUTED_CHAT) {
      const publisher = getRedisPubSubPublisher();
      const subscriber = getRedisPubSubSubscriber();
      await Promise.all([publisher.quit(), subscriber.quit()]);
    }

    appLogger.info("Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    appLogger.error({ error }, "Error during graceful shutdown");
    process.exit(1);
  }
}

// Register signal handlers for graceful shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default {
  port: env.PORT,
  hostname: "0.0.0.0",
  fetch: app.fetch,
  websocket,
};
