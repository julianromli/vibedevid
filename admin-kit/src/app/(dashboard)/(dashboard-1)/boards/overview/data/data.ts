import { ForwardRefExoticComponent, RefAttributes } from "react"
import {
  Icon,
  IconGift,
  IconMenuOrder,
  IconProps,
  IconSubscript,
} from "@tabler/icons-react"

export const dashboard2Stats: Dashboard2Stats[] = [
  {
    label: "New Subscriptions",
    description: "Total number of new subscriptions",
    stats: 4682,
    type: "up",
    percentage: 15.54,
    chartData: [
      { month: "Monday", value: 200 },
      { month: "Tuesday", value: 305 },
      { month: "Webnesday", value: 237 },
      { month: "Thursday", value: 73 },
      { month: "Friday", value: 209 },
      { month: "Saturday", value: 10 },
      { month: "Sunday", value: 214 },
    ],
    strokeColor: "var(--chart-1)",
    icon: IconSubscript,
  },
  {
    label: "New Orders",
    description: "Total number of new orders",
    stats: 1226,
    type: "down",
    percentage: 40.2,
    chartData: [
      { month: "Monday", value: 186 },
      { month: "Tuesday", value: 305 },
      { month: "Webnesday", value: 237 },
      { month: "Thursday", value: 73 },
      { month: "Friday", value: 209 },
      { month: "Saturday", value: 214 },
      { month: "Sunday", value: 214 },
    ],
    strokeColor: "var(--chart-2)",
    icon: IconMenuOrder,
  },
  {
    label: "Avg Order Revenue",
    description: "Average order of revenue",
    stats: 1080,
    type: "up",
    percentage: 10.8,
    chartData: [
      { month: "Monday", value: 50 },
      { month: "Tuesday", value: 125 },
      { month: "Webnesday", value: 240 },
      { month: "Thursday", value: 93 },
      { month: "Friday", value: 209 },
      { month: "Saturday", value: 150 },
      { month: "Sunday", value: 300 },
    ],
    strokeColor: "#6366f1",
    icon: IconGift,
  },
]

export type Dashboard2Stats = {
  label: string
  description: string
  stats: number
  type: "up" | "down"
  percentage: number
  chartData: {
    [x: string]: PropertyKey
    value: number
  }[]
  strokeColor: string
  icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
}
