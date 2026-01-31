"use client"

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StatsCard from "./stats-card"

type Duration = "month" | "week"

const chartData = [
  { month: "January", visitors: 186, returning: 80 },
  { month: "February", visitors: 305, returning: 200 },
  { month: "March", visitors: 237, returning: 120 },
  { month: "April", visitors: 73, returning: 190 },
  { month: "May", visitors: 209, returning: 130 },
  { month: "June", visitors: 214, returning: 140 },
]
const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "var(--chart-1)",
  },
  returning: {
    label: "Returning",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export default function VisitorsCard() {
  const [duration, setDuration] = useState<Duration>("week")

  return (
    <Card className="h-full w-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Visitors</CardTitle>
          <Tabs
            onValueChange={(e) => {
              setDuration(e as Duration)
            }}
            defaultValue="week"
            value={duration}
          >
            <TabsList className="grid h-auto w-full grid-cols-2 p-[3px]">
              <TabsTrigger className="py-[3px]" value="month">
                Month
              </TabsTrigger>
              <TabsTrigger className="py-[3px]" value="week">
                Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription>Key visitor information at a glance</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6">
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 sm:grid-rows-2">
          <div className="col-span-2 row-start-1 row-end-2">
            <StatsCard
              title="New Visitors"
              description="Total Visitors"
              stats={36786}
              profitPercentage={66.7}
              profitNumber={10}
              type="asc"
              sign="number"
            />
          </div>
          <div className="col-span-2 sm:row-start-2 sm:row-end-3">
            <StatsCard
              title="Returning"
              description="Total Returning"
              stats={467}
              profitPercentage={5.5}
              profitNumber={-6}
              type="des"
              sign="number"
            />
          </div>
          <div className="col-span-4 sm:col-span-3 sm:row-span-3">
            <ChartContainer
              className="h-full max-h-[240px] w-full"
              config={chartConfig}
            >
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />

                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <defs>
                  <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-visitors)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-visitors)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillReturning"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-returning)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-returning)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="returning"
                  type="natural"
                  fill="url(#fillReturning)"
                  fillOpacity={0.4}
                  stroke="var(--color-returning)"
                  stackId="a"
                />
                <Area
                  dataKey="visitors"
                  strokeDasharray="5 5"
                  type="natural"
                  fill="url(#fillVisitors)"
                  fillOpacity={0.4}
                  stroke="var(--color-visitors)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
