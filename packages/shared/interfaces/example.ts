import { z } from "zod";

export const exampleSchema = z.object({
  id: z.string(),
  message: z.string().min(5).max(40),
  postedAt: z.string(),
});
export type Example = z.infer<typeof exampleSchema>;

export const newExampleSchema = exampleSchema.omit({ id: true, postedAt: true });
export type NewExample = z.infer<typeof newExampleSchema>;
