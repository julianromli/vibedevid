import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { recentActivityStatus } from "../data/data"
import { getRecentActivites } from "../data/recent-activities"
import { recentActivityListSchema } from "../data/schema"

export default function RecentActivity() {
  const recentActivities = getRecentActivites()
  const recentActivityList = recentActivityListSchema.parse(recentActivities)

  return (
    <Card className="h-full">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Select>
            <SelectTrigger className="w-min">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_24h">Last 24h</SelectItem>
              <SelectItem value="last_week">Last Week</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%_-_68px)] px-2 pt-0">
        <Table>
          <TableCaption>A list of your recent activity.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentActivityList.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/" alt="Avatar" />
                      <AvatarFallback>
                        {activity.username.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <p className="font-bold">{activity.username}</p>
                      <p className="text-xs opacity-70">{activity.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "dark:bg-opacity-5 rounded-full px-2 py-[4px] text-[11px] leading-none",
                      recentActivityStatus.get(activity.status)
                    )}
                  >
                    {activity.status}
                  </Badge>
                </TableCell>
                <TableCell className="tracking-tight">#329341</TableCell>
                <TableCell>
                  {format(activity.createdAt, "mm ")}min ago
                </TableCell>
                <TableCell className="text-right">${activity.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
