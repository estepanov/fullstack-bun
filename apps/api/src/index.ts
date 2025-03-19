import { Hono } from 'hono'
import { exampleRouter } from './routers/example-router'
import { cors } from 'hono/cors'

const app = new Hono()

const allowedOrigins = process.env.CORS_ALLOWLISTED_ORIGINS?.split(',') || []

const routes = app.use('*', cors({
  origin: allowedOrigins
})).route('/example', exampleRouter)

export type AppType = typeof routes

export default {
  port: process.env.PORT || 3001,
  fetch: app.fetch,
} 
