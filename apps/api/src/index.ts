import { Hono } from 'hono'
import { exampleRouter } from './routers/example-router'
import { cors } from 'hono/cors'

const app = new Hono()

const routes = app.use('*', cors()).route('/example', exampleRouter)

export type AppType = typeof routes

export default {
  port: 3333,
  fetch: app.fetch,
} 
