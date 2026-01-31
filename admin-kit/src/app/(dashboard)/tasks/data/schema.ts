import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.union([
    z.literal("in progress"),
    z.literal("backlog"),
    z.literal("todo"),
    z.literal("canceled"),
    z.literal("done"),
  ]),
  label: z.union([
    z.literal("documentation"),
    z.literal("bug"),
    z.literal("feature"),
  ]),
  priority: z.union([z.literal("high"), z.literal("medium"), z.literal("low")]),
  createdDate: z.coerce.date(), // Will coerce string to Date
  dueDate: z.coerce.date(), // Will coerce string to Date
  estimatedTime: z.string(),
  sprintCycle: z.string(),
})

export type Task = z.infer<typeof taskSchema>

export const taskListSchema = z.array(taskSchema)
