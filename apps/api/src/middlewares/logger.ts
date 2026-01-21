import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { AUTH_CONFIG } from "shared/config/auth";
import { type AppLogger, appLogger } from "../utils/logger";

export const requestLogFormat = ({
  status,
  method,
  url,
}: {
  status: number;
  method: string;
  url: string;
}) => {
  return `${method} ${status} - ${url}`;
};

export type LoggerMiddlewareEnv = {
  Variables: {
    logger: AppLogger;
    requestId: string;
    sessionId: string;
  };
};

export const loggerMiddleware = () =>
  createMiddleware<LoggerMiddlewareEnv>(async (c, next) => {
    const requestId = c.req.header("x-request-id");
    const sessionId = c.req.header("x-session-id");
    const isOptionsReq = c.req.method === "OPTIONS";
    const isWebSocketUpgrade = c.req.header("upgrade")?.toLowerCase() === "websocket";
    const isSSEStream =
      c.req.path.includes("/stream") &&
      c.req.header("accept")?.includes("text/event-stream");
    const isAuthCallback = c.req.path.includes(`${AUTH_CONFIG.basePath}/callback/`);
    const fallbackId = () => `ws-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    // OPTIONS requests (CORS preflight), WS upgrades, and SSE streams won't include these headers.
    // EventSource API doesn't support custom headers in browsers.
    if (
      !isAuthCallback &&
      !isOptionsReq &&
      !isWebSocketUpgrade &&
      !isSSEStream &&
      (!requestId || !sessionId)
    ) {
      throw new HTTPException(400, { message: "Missing required headers" });
    }
    const resolvedRequestId =
      requestId ?? globalThis.crypto?.randomUUID?.() ?? fallbackId();
    const resolvedSessionId =
      sessionId ?? globalThis.crypto?.randomUUID?.() ?? fallbackId();
    const requestLogger = appLogger.child({
      requestId: resolvedRequestId,
      sessionId: resolvedSessionId,
    });
    c.set("logger", requestLogger);
    c.set("requestId", resolvedRequestId);
    c.set("sessionId", resolvedSessionId);
    if (isWebSocketUpgrade) {
      c.get("logger").info(
        {
          url: c.req.url,
          userAgent: c.req.header("user-agent"),
          origin: c.req.header("origin"),
        },
        "WebSocket upgrade",
      );
    }
    if (isSSEStream) {
      c.get("logger").info(
        {
          url: c.req.url,
          userAgent: c.req.header("user-agent"),
          origin: c.req.header("origin"),
        },
        "SSE stream connection",
      );
    }
    await next();
    if (isWebSocketUpgrade || isSSEStream) {
      return;
    }
    c.get("logger").info(
      requestLogFormat({
        status: c.res.status,
        method: c.req.method,
        url: c.req.url,
      }),
    );
  });
