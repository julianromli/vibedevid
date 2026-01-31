import { z } from "zod"
import { webhookEvents } from "./webhook-data"

export const webhookAuthTypeSchema = z.union([
  z.literal("none"),
  z.literal("application"),
  z.literal("platform"),
])

export const webhookEventSchema = z.enum(webhookEvents)

const webhookAuthStatusSchema = z.union([
  z.literal("enabled"),
  z.literal("disabled"),
])

const webhookLogSchema = z.object({
  succeeded: z.boolean(),
  action: z.string(),
  datetime: z.coerce.date(),
})
export type WebhookLog = z.infer<typeof webhookLogSchema>

const webhookSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  name: z.string(),
  description: z.string().optional(),
  authType: webhookAuthTypeSchema,
  status: webhookAuthStatusSchema,
  events: z.array(webhookEventSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  logs: z.array(webhookLogSchema),
})
export type Webhook = z.infer<typeof webhookSchema>

export const webhookListSchema = z.array(webhookSchema)
