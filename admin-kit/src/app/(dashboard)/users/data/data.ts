import {
  IconCash,
  IconShield,
  IconUserCheck,
  IconUserScan,
  IconUsersGroup,
  IconUserShield,
  IconUsersPlus,
  TablerIcon,
} from "@tabler/icons-react"
import { UserStatus } from "./schema"

export const callTypes = new Map<UserStatus, string>([
  ["active", "bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200"],
  ["inactive", "bg-neutral-300/40 border-neutral-300"],
  ["invited", "bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300"],
  [
    "suspended",
    "bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10",
  ],
])

export const userTypes = [
  {
    label: "Superadmin",
    value: "superadmin",
    icon: IconShield,
  },
  {
    label: "Admin",
    value: "admin",
    icon: IconUserShield,
  },
  {
    label: "Manager",
    value: "manager",
    icon: IconUsersGroup,
  },
  {
    label: "Cashier",
    value: "cashier",
    icon: IconCash,
  },
] as const

/* ========== User Stats ========== */

export interface UserStatProps {
  title: string
  desc: string
  stat: string
  statDesc: string
  icon: TablerIcon
}

export const userStats: UserStatProps[] = [
  {
    title: "Total Users",
    desc: "Total number of users",
    stat: "12,000",
    statDesc: "+5% than last month",
    icon: IconUsersGroup,
    // icon: <IconUsersGroup size={16} />,
  },
  {
    title: "New Users",
    desc: "Total number of users who joined this month",
    stat: "+350",
    statDesc: "+10% vs last month",
    icon: IconUsersPlus,
  },
  {
    title: "Pending Verifications",
    desc: "Total number of users pending verification",
    stat: "42",
    statDesc: "2% of users",
    icon: IconUserScan,
  },
  {
    title: "Active Users",
    desc: "Number of active users in the last 30 days",
    stat: "7800",
    statDesc: "65% of all users",
    icon: IconUserCheck,
  },
  // {
  //   title: "New Users",
  //   desc: "Total number of users who joined this month",
  //   stat: "+350",
  //   statDesc: "+10% vs last month",
  //   icon: <IconUsersPlus size={16} />,
  // },
  // {
  //   title: "Pending Verifications",
  //   desc: "Total number of users pending verification",
  //   stat: "42",
  //   statDesc: "2% of users",
  //   icon: <IconUserScan size={16} />,
  // },
  // {
  //   title: "Active Users",
  //   desc: "Number of active users in the last 30 days",
  //   stat: "7800",
  //   statDesc: "65% of all users",
  //   icon: <IconUserCheck size={16} />,
  // },
]
