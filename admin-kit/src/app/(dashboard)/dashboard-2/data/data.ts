import {
  IconClipboardCheck,
  IconReceiptFilled,
  IconReportMoney,
  IconUserFilled,
} from "@tabler/icons-react"
import { RecentActivityStatus } from "./schema"

export const recentActivityStatus = new Map<RecentActivityStatus, string>([
  [
    "Delete",
    "bg-destructive/10 border-destructive/30 text-destructive dark:bg-destructive/50 dark:text-foreground dark:border-destructive",
  ],
  ["Invited", ""],
  [
    "Suspended",
    "bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-200 dark:text-orange-400",
  ],
  [
    "New",
    "bg-sky-100 border-sky-300 text-sky-700 dark:bg-sky-200 dark:text-sky-300",
  ],
])

export const dashboard1Stats = [
  {
    label: "Total Sales",
    type: "up",
    percentage: 10.2,
    stats: 4523189,
    sign: "money",
    profit: 1454.89,
    icon: IconReportMoney,
  },
  {
    label: "Total Orders",
    type: "up",
    percentage: 20.2,
    stats: 12545,
    sign: "number",
    profit: 1589,
    icon: IconClipboardCheck,
  },
  {
    label: "Total Visitors",
    type: "down",
    percentage: 14.2,
    stats: 8344,
    sign: "number",
    profit: 89,
    icon: IconUserFilled,
  },
  {
    label: "Refunded",
    type: "up",
    percentage: 12.6,
    stats: 3148,
    sign: "number",
    profit: 48,
    icon: IconReceiptFilled,
  },
] as const
