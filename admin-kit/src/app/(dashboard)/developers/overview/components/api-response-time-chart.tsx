"use client"

import { TrendingDown } from "lucide-react"
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts"
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
  { week: "W1", time: 350 },
  { week: "W2", time: 190 },
  { week: "W3", time: 460 },
  { week: "W4", time: 142 },
  { week: "W5", time: 220 },
  { week: "W6", time: 200 },
]

const chartConfig = {
  time: {
    label: "Time (ms)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ApiResponseTimeChart({ className = "" }: Props) {
  const times = chartData.map((item) => item.time)
  const minTime = Math.round(Math.min(...times))
  const maxTime = Math.round(Math.max(...times))
  const avgTime = Math.round(
    times.reduce((sum, time) => sum + time, 0) / times.length
  )
  return (
    <Card
      className={cn(
        "space-y-4 rounded-none border-none bg-transparent shadow-none",
        className
      )}
    >
      <CardHeader className="space-y-2 p-0">
        <CardTitle>API response time</CardTitle>
        <CardDescription className="flex gap-4">
          <div>
            <div className="text-muted-foreground/85 text-xs font-semibold">
              Min
            </div>
            <span className="text-foreground text-xs">{minTime}ms</span>
          </div>
          <div>
            <div className="text-muted-foreground/85 text-xs font-semibold">
              Avg
            </div>
            <span className="text-foreground text-xs">{avgTime}ms</span>
          </div>
          <div>
            <div className="text-muted-foreground/85 text-xs font-semibold">
              Max
            </div>
            <span className="text-foreground text-xs">{maxTime}ms</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
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
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="time"
              type="natural"
              stroke="var(--color-time)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-time)",
              }}
              activeDot={{
                r: 6,
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 p-0 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Response time decreased by 20ms this week{" "}
          <TrendingDown className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Average API response time for the past 6 weeks in milliseconds
        </div>
      </CardFooter>
    </Card>
  )
}
