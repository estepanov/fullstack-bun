import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'
import { v4 as uuidv4 } from 'uuid';

export const exampleSchema = z.object({
  id: z.string(),
  body: z.string().min(5).max(40),
})
export type Example = z.infer<typeof exampleSchema>

export const newExampleSchema = exampleSchema.omit({ id: true })
export type NewExample = z.infer<typeof newExampleSchema>

const DB: Example[] = [
  { id: uuidv4(), body: 'hello' },
  { id: uuidv4(), body: 'world' },
]

const exampleRouter = new Hono()
  .get('/', (c) => c.json({ list: DB }))
  .get('/special', (c) => c.json({ id: 1, name: 'Special Example' }))
  .get('/:id', (c) => {
    const id = c.req.param('id')
    return c.json({ id, name: `Example ${id}` })
  })
  .post('/', zValidator('json', newExampleSchema), async (c) => {
    const body = await c.req.json<NewExample>()
    DB.push({ id: uuidv4(), body: body.body })
    return c.json({ success: true })
  })

export { exampleRouter }