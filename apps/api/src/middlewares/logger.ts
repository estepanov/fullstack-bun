import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { type AppLogger, appLogger } from "../utils/logger";

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
    if (!isOptionsReq && (!requestId || !sessionId)) {
      throw new HTTPException(400, { message: "Missing required headers" });
    }
    const requestLogger = appLogger.child({
      path: c.req.path,
      method: c.req.method,
      requestId,
      sessionId,
    });
    c.set("logger", requestLogger);
    await next();
    requestLogger.info({
      response: c.res.status,
    });
  });
