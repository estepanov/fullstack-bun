import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
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
  return `${status} - ${method} - ${url}`;
};

export type LoggerMiddlewareEnv = {
  Variables: {
    logger: AppLogger;
  };
};

export const loggerMiddleware = () =>
  createMiddleware<LoggerMiddlewareEnv>(async (c, next) => {
    const requestId = c.req.header("x-request-id");
    const sessionId = c.req.header("x-session-id");
    const isOptionsReq = c.req.method === "OPTIONS";

    // OPTIONS requests (CORS preflight) don't need these headers
    if (!isOptionsReq && (!requestId || !sessionId)) {
      throw new HTTPException(400, { message: "Missing required headers" });
    }
    const requestLogger = appLogger.child({
      requestId,
      sessionId,
    });
    c.set("logger", requestLogger);
    await next();
    c.get("logger").info(
      requestLogFormat({
        status: c.res.status,
        method: c.req.method,
        url: c.req.url,
      }),
    );
  });
