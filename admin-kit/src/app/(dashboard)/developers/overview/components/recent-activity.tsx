import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getActivityIcon, recentActivity } from "../data/data"

interface Props {
  className?: string
}

export default function RecentActivity({ className = "" }: Props) {
  return (
    <Card
      className={cn(
        "space-y-4 rounded-none border-none bg-transparent shadow-none",
        className
      )}
    >
      <CardHeader className="p-0">
        <CardTitle>Recent activities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {recentActivity.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4">
            <div className="mt-1">{getActivityIcon(activity.type)}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium tracking-tight">
                  {activity.title}
                </p>
                <span className="text-muted-foreground text-xs">
                  {activity.time}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {activity.description}
              </p>
              <div className="flex items-center pt-2">
                <Avatar className="mr-2 h-8 w-8">
                  <AvatarImage
                    src={activity.user.avatar}
                    alt={activity.user.name}
                  />
                  <AvatarFallback>
                    {activity.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground text-sm">
                  {activity.user.name}
                </span>
                <span
                  className={`ml-auto rounded-full px-2 py-1 text-xs ${
                    activity.status === "open"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : activity.status === "closed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : activity.status === "merged"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
