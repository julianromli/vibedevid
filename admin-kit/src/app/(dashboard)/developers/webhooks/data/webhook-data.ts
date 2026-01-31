import { faker } from "@faker-js/faker"
import { Webhook } from "./schema"

export const webhookEvents = [
  "user.created",
  "order.placed",
  "payment.failed",
  "user.deleted",
] as const

const generateWebhookData = (count: number): Webhook[] => {
  const createdAt = faker.date.past()
  const updatedAt = faker.date.between({ from: createdAt, to: new Date() })
  const logCount = faker.number.int({ min: 1, max: 20 })
  return Array.from({ length: count }).map(() => ({
    id: faker.string.uuid(),
    url: faker.internet.url(),
    name: faker.lorem.words({ min: 1, max: 2 }),
    description: faker.lorem.sentence(),
    authType: faker.helpers.arrayElement(["none", "application", "platform"]),
    status: faker.helpers.arrayElement(["enabled", "disabled"]),
    events: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }).map(
      () => faker.helpers.arrayElement(webhookEvents)
    ),
    createdAt,
    updatedAt,
    logs: Array.from({ length: logCount }).map(() => ({
      succeeded: faker.datatype.boolean(),
      action: faker.helpers.arrayElement(webhookEvents),
      datetime: faker.date.past(),
    })),
  }))
}

// Singleton data
let webhooks: Webhook[] | null = null

export const getWebhookData = (count = 7) => {
  if (!webhooks) {
    webhooks = generateWebhookData(count) // Generate data once
  }
  return webhooks
}
