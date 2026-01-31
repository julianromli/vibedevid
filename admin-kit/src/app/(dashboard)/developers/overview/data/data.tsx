import { AlertCircle, GitCommit, GitMerge, GitPullRequest } from "lucide-react"

export const recentActivity = [
  {
    id: 1,
    type: "pull-request",
    title: "Update user authentication",
    description: "Improved security measures and fixed login bugs",
    user: { name: "John Doe", avatar: "/placeholder.svg?height=32&width=32" },
    time: "2 hours ago",
    status: "open",
  },
  {
    id: 2,
    type: "issue-closed",
    title: "Fix responsive layout on mobile",
    description: "Resolved layout issues for small screen devices",
    user: { name: "Jane Smith", avatar: "/placeholder.svg?height=32&width=32" },
    time: "5 hours ago",
    status: "closed",
  },
  {
    id: 3,
    type: "commit",
    title: "Refactor API endpoints",
    description: "Improved performance and reduced redundancy",
    user: {
      name: "Mike Johnson",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    time: "1 day ago",
    status: "merged",
  },
  {
    id: 4,
    type: "issue-opened",
    title: "Performance optimization needed",
    description: "Identified areas for improving application speed",
    user: { name: "Alex Lee", avatar: "/placeholder.svg?height=32&width=32" },
    time: "3 days ago",
    status: "open",
  },
] as const

type RecentActivity = (typeof recentActivity)[number]

export const getActivityIcon = (type: RecentActivity["type"]) => {
  switch (type) {
    case "pull-request":
      return <GitPullRequest className="h-5 w-5 text-blue-500" />
    case "issue-closed":
      return <GitMerge className="h-5 w-5 text-green-500" />
    case "commit":
      return <GitCommit className="h-5 w-5 text-purple-500" />
    case "issue-opened":
      return <AlertCircle className="h-5 w-5 text-red-500" />
    default:
      return null
  }
}
