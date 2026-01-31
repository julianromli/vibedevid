import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandLinkedin,
  IconBrandVercel,
} from "@tabler/icons-react"
import { BadgeProps } from "@/components/ui/badge"

export const routeViews = [
  {
    route: "/",
    viewCount: 48,
  },
  {
    route: "/dashboard-2",
    viewCount: 60,
  },
  {
    route: "/dashboard-3",
    viewCount: 56,
  },
  {
    route: "/tasks",
    viewCount: 98,
  },
  {
    route: "/users",
    viewCount: 52,
  },
]

export const pageViews = [
  {
    route: "/api-keys",
    viewCount: 112,
  },
  {
    route: "/overview",
    viewCount: 45,
  },
  {
    route: "/event-logs",
    viewCount: 24,
  },
  {
    route: "/login",
    viewCount: 134,
  },
  {
    route: "/otp",
    viewCount: 120,
  },
]

export const referrers = [
  {
    name: "facebook.com",
    icon: IconBrandFacebook,
    visitors: 8,
  },
  {
    name: "github.com",
    icon: IconBrandGithub,
    visitors: 6,
  },
  {
    name: "google.com",
    icon: IconBrandGoogle,
    visitors: 5,
  },
  {
    name: "lnkd.in",
    icon: IconBrandLinkedin,
    visitors: 9,
  },
  {
    name: "vercel.com",
    icon: IconBrandVercel,
    visitors: 2,
  },
]

export const timelines = [
  {
    label: "Past 30 minutes",
    value: "past_30_min",
  },
  {
    label: "Maximum (1hour)",
    value: "max_1_hour",
  },
  {
    label: "Custom",
    value: "custom",
  },
] as const

export type Timeline = (typeof timelines)[number]["value"]

export const containsLevelOptions = [
  {
    label: "Warning",
    value: 10,
  },
  {
    label: "Error",
    value: 4,
  },
]

export const environmentOptions = [
  {
    label: "Development",
    value: 2,
  },
  {
    label: "Production",
    value: 1,
  },
]

export const eventTypeOptions = [
  {
    label: "API Endpoint",
    value: 4,
  },
  {
    label: "Server-side Rendering",
    value: 2,
  },
  {
    label: "Partial Prerendering",
    value: 1,
  },
  {
    label: "Server Components",
    value: 5,
  },
  {
    label: "Cron Job",
    value: 3,
  },
]

export const logEntries = [
  {
    id: 1,
    timestamp: "2023-05-01 10:30:15",
    level: "INFO",
    message: "Application started successfully",
    source: "app.js",
  },
  {
    id: 2,
    timestamp: "2023-05-01 10:31:23",
    level: "WARN",
    message: "High memory usage detected",
    source: "system.monitor.js",
  },
  {
    id: 3,
    timestamp: "2023-05-01 10:32:46",
    level: "ERROR",
    message: "Failed to connect to database",
    source: "database.js",
  },
  {
    id: 4,
    timestamp: "2023-05-01 10:33:12",
    level: "INFO",
    message: "User authentication successful",
    source: "auth.js",
  },
  {
    id: 5,
    timestamp: "2023-05-01 10:34:57",
    level: "DEBUG",
    message: "Cache miss for key: user_preferences",
    source: "cache.js",
  },
  {
    id: 6,
    timestamp: "2023-05-01 10:35:30",
    level: "INFO",
    message: "API request received: GET /api/users",
    source: "api.js",
  },
  {
    id: 7,
    timestamp: "2023-05-01 10:36:05",
    level: "WARN",
    message: "Deprecated function called: oldFunction()",
    source: "legacy.js",
  },
] as const

type LogEntry = (typeof logEntries)[number]["level"]

export function getLevelVariant(level: LogEntry): BadgeProps["variant"] {
  switch (level) {
    case "ERROR":
      return "destructive"
    case "WARN":
      return "default"
    case "INFO":
      return "secondary"
    case "DEBUG":
      return "outline"
    default:
      return "secondary"
  }
}

export const mockRoutes = [
  {
    route: "/",
    viewCount: 1500,
    avgTimeOnPage: 120,
    bounceRate: 35,
    lastVisited: "2023-12-28",
  },
  {
    route: "/about",
    viewCount: 750,
    avgTimeOnPage: 90,
    bounceRate: 40,
    lastVisited: "2023-12-27",
  },
  {
    route: "/products",
    viewCount: 1200,
    avgTimeOnPage: 180,
    bounceRate: 25,
    lastVisited: "2023-12-28",
  },
  {
    route: "/contact",
    viewCount: 500,
    avgTimeOnPage: 60,
    bounceRate: 50,
    lastVisited: "2023-12-26",
  },
  {
    route: "/blog",
    viewCount: 900,
    avgTimeOnPage: 240,
    bounceRate: 30,
    lastVisited: "2023-12-28",
  },
  {
    route: "/services",
    viewCount: 800,
    avgTimeOnPage: 150,
    bounceRate: 35,
    lastVisited: "2023-12-27",
  },
  {
    route: "/faq",
    viewCount: 300,
    avgTimeOnPage: 180,
    bounceRate: 20,
    lastVisited: "2023-12-25",
  },
  {
    route: "/terms",
    viewCount: 150,
    avgTimeOnPage: 45,
    bounceRate: 60,
    lastVisited: "2023-12-24",
  },
  {
    route: "/privacy",
    viewCount: 200,
    avgTimeOnPage: 60,
    bounceRate: 55,
    lastVisited: "2023-12-26",
  },
  {
    route: "/careers",
    viewCount: 400,
    avgTimeOnPage: 210,
    bounceRate: 25,
    lastVisited: "2023-12-27",
  },
  {
    route: "/support",
    viewCount: 600,
    avgTimeOnPage: 300,
    bounceRate: 15,
    lastVisited: "2023-12-28",
  },
  {
    route: "/login",
    viewCount: 1000,
    avgTimeOnPage: 30,
    bounceRate: 10,
    lastVisited: "2023-12-28",
  },
  {
    route: "/register",
    viewCount: 850,
    avgTimeOnPage: 180,
    bounceRate: 20,
    lastVisited: "2023-12-28",
  },
  {
    route: "/dashboard",
    viewCount: 700,
    avgTimeOnPage: 600,
    bounceRate: 5,
    lastVisited: "2023-12-28",
  },
  {
    route: "/settings",
    viewCount: 350,
    avgTimeOnPage: 120,
    bounceRate: 30,
    lastVisited: "2023-12-27",
  },
]
