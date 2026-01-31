import { ForwardRefExoticComponent, RefAttributes } from "react"
import {
  type Icon,
  IconArrowNarrowRight,
  IconDots,
  IconProps,
} from "@tabler/icons-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  label: string
  icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
  percentage: number
  type: "up" | "down"
  sign?: "money" | "number"
  stats: number
  profit: number
}

export default function StatsCard({
  label,
  icon: Icon,
  type,
  sign = "number",
  stats,
  percentage,
  profit,
}: Props) {
  return (
    <Card className="h-full w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div className="bg-opacity-25 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
            <Icon className="text-indigo-400" size={14} />
          </div>
          <span>{label}</span>
        </CardTitle>
        <IconDots className="cursor-pointer opacity-60" size={16} />
      </CardHeader>
      <CardContent className="space-y-[10px] px-4 pt-0 pb-4">
        <p className="text-2xl font-bold">
          {sign === "money" && "$"}
          {stats.toLocaleString()}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={cn("flex items-center gap-1", {
              "text-emerald-400": type === "up",
              "text-red-400": type === "down",
            })}
          >
            {type === "up" ? (
              <ArrowUpRight size={16} />
            ) : (
              <ArrowDownRight size={16} />
            )}
            <p className="text-xs font-bold">{percentage.toLocaleString()}%</p>
          </div>
          <p className="text-muted-foreground text-xs font-normal">
            {type === "up" ? "+" : "-"}
            {profit.toLocaleString()} today
          </p>
        </div>
        <div className="bg-muted-foreground h-[0.04px] w-full opacity-50" />

        <div className="flex items-center gap-2">
          <p className="text-xs font-medium">View Report</p>
          <IconArrowNarrowRight size={18} />
        </div>
      </CardContent>
    </Card>
  )
}
