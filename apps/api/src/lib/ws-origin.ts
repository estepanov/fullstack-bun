import type { Context, MiddlewareHandler } from "hono";
import { env } from "../env";

const normalizedAllowedOrigins = new Set(
  env.CORS_ALLOWLISTED_ORIGINS.map((origin) => origin.toLowerCase().trim()),
);

export const isAllowedWebSocketOrigin = (origin?: string | null) => {
  if (!origin) {
    return false;
  }

  return normalizedAllowedOrigins.has(origin.toLowerCase().trim());
};

const logRejectedOrigin = (c: Context, origin?: string | null) => {
  try {
    const logger = c.get("logger");
    if (logger?.warn) {
      logger.warn({ origin }, "Rejected WebSocket upgrade due to untrusted origin");
    }
  } catch {
    // Ignore logging failures to avoid breaking the guard.
  }
};

export const withWebSocketOriginGuard = (
  handler: MiddlewareHandler,
): MiddlewareHandler => {
  return async (c, next) => {
    const origin = c.req.header("origin");
    if (!isAllowedWebSocketOrigin(origin)) {
      logRejectedOrigin(c, origin);
      return c.text("Forbidden", 403);
    }

    return handler(c, next);
  };
};
