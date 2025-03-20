import { createMiddleware } from 'hono/factory'
import { logger } from '../utils/logger'

export const loggerMiddleware = () => createMiddleware(async (c, next) => {
  await next()
  logger.info({
    path: c.req.path,
    method: c.req.method,
    requestId: c.req.header('x-request-id'),
    sessionId: c.req.header('x-session-id')
  })
})