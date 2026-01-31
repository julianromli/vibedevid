import { faker } from "@faker-js/faker"
import { RecentActivity } from "./schema"

const generateRecentActivities = () =>
  Array.from({ length: 5 }, () => {
    const name = faker.person.firstName()
    return {
      id: faker.string.uuid(),
      username: name,
      email: faker.internet.email({ firstName: name }).toLocaleLowerCase(),
      amount: Number(faker.finance.amount()),
      status: faker.helpers.arrayElement([
        "New",
        "Delete",
        "Invited",
        "Suspended",
      ]),
      createdAt: faker.date.past(),
    }
  })

// Singleton data
let recentActivities: RecentActivity[] | null = null

export const getRecentActivites = () => {
  if (!recentActivities) {
    recentActivities = generateRecentActivities()
  }
  return recentActivities
}
