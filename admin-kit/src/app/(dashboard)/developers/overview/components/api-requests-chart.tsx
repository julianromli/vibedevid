"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface Props {
  className?: string
}

const chartData = [
  { week: "W1", count: 40 },
  { week: "W2", count: 24 },
  { week: "W3", count: 52 },
  { week: "W4", count: 33 },
  { week: "W5", count: 80 },
  { week: "W6", count: 95 },
]

const chartConfig = {
  count: {
    label: "Count",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ApiRequestsChart({ className = "" }: Props) {
  return (
    <Card
      className={cn(
        "space-y-4 rounded-none border-none bg-transparent shadow-none",
        className
      )}
    >
      <CardHeader className="space-y-2 p-0">
        <CardTitle>API requests</CardTitle>
        <CardDescription className="flex gap-4">
          <div>
            <div className="text-muted-foreground/85 text-xs font-semibold">
              Successful
            </div>
            <span className="text-foreground text-sm">270</span>
          </div>
          <div>
            <div className="text-muted-foreground/85 text-xs font-semibold">
              Failed
            </div>
            <span className="text-foreground text-sm">6</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="count"
              type="linear"
              stroke="var(--color-count)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 p-0 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Requests increased by 8.7% this week{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Displaying total API requests for the past {chartData.length} weeks
        </div>
      </CardFooter>
    </Card>
  )
}
