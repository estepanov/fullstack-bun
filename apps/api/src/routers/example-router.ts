import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'
import { v4 as uuidv4 } from 'uuid';
import { LoggerMiddlewareEnv } from "../middlewares/logger";

export const exampleSchema = z.object({
  id: z.string(),
  message: z.string().min(5).max(40),
  postedAt: z.string()
})
export type Example = z.infer<typeof exampleSchema>

export const newExampleSchema = exampleSchema.omit({ id: true, postedAt: true })
export type NewExample = z.infer<typeof newExampleSchema>

const DB: Example[] = [
  { id: uuidv4(), message: 'hello friend', postedAt: new Date().toISOString() },
  { id: uuidv4(), message: 'hello world', postedAt: new Date().toISOString() },
]

const exampleRouter = new Hono<LoggerMiddlewareEnv>()
  .get('/', (c) => c.json({ list: DB.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()) }))
  .get('/special', (c) => c.json({ id: 1, name: 'Special Example' }))
  .get('/:id', (c) => {
    const id = c.req.param('id')
    return c.json({ id, name: `Example ${id}` })
  })
  .post('/', zValidator('json', newExampleSchema), async (c) => {
    const body = await c.req.json<NewExample>()
    c.var.logger.info(body, 'Incoming body')
    DB.push({ id: uuidv4(), message: body.message, postedAt: new Date().toISOString() })
    return c.json({ success: true })
  })

export { exampleRouter }