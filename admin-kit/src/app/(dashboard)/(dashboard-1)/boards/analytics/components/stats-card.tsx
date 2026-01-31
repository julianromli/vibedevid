import {
  IconInfoCircle,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Props {
  title: string
  description: string
  stats: number
  type: "asc" | "des"
  sign?: "dollar" | "number"
  profitPercentage: number
  profitNumber: number
}

export default function StatsCard({
  title,
  description,
  stats,
  type,
  sign = "dollar",
  profitNumber,
  profitPercentage,
}: Props) {
  return (
    <Card className="bg-muted h-full w-full">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {title}
        </CardTitle>
        <TooltipProvider>
          <Tooltip delayDuration={50}>
            <TooltipTrigger>
              <IconInfoCircle className="text-muted-foreground scale-90 stroke-[1.25]" />
              <span className="sr-only">More Info</span>
            </TooltipTrigger>
            <TooltipContent>{description}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-3">
        <div className="text-lg font-bold sm:text-2xl">
          {sign === "dollar" ? "$" : ""}
          {stats.toLocaleString()}
        </div>
        <div
          className={cn("flex items-center gap-1 text-xs font-medium", {
            "text-emerald-500": type === "asc",
            "text-red-500": type === "des",
          })}
        >
          <span className="inline-block">
            {type === "asc" ? (
              <IconTrendingUp size={20} />
            ) : (
              <IconTrendingDown size={20} />
            )}
          </span>
          <span>{profitPercentage.toLocaleString()}%</span>
          <span>
            ({type === "asc" && "+"}
            {profitNumber.toLocaleString()})
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
