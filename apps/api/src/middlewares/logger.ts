import { createMiddleware } from 'hono/factory'
import { AppLogger, appLogger } from '../utils/logger'

export type LoggerMiddlewareEnv = {
  Variables: {
    logger: AppLogger
  }
}

export const loggerMiddleware = () => createMiddleware<LoggerMiddlewareEnv>(async (c, next) => {
  const requestLogger = appLogger.child({
    path: c.req.path,
    method: c.req.method,
    requestId: c.req.header('x-request-id'),
    sessionId: c.req.header('x-session-id')
  })
  c.set("logger", requestLogger)
  await next()
  requestLogger.info({
    response: c.res.status
  })
})