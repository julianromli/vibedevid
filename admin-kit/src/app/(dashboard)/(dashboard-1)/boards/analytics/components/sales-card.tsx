"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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

const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const chartData = [
  { month: "January", visitors: 186 },
  { month: "February", visitors: 305 },
  { month: "March", visitors: 237 },
  { month: "April", visitors: 73 },
  { month: "May", visitors: 209 },
  { month: "June", visitors: 214 },
]

export default function SalesCard() {
  const [duration, setDuration] = useState<Duration>("week")

  return (
    <Card className="h-full w-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Sales</CardTitle>
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
        <CardDescription>Visualize sales performance trends</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6">
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 sm:grid-rows-2">
          <div className="col-span-2 row-start-1 row-end-2">
            <StatsCard
              title="Net Sales"
              description="Total Sales"
              stats={4567820}
              profitPercentage={24.5}
              profitNumber={+10}
              type="asc"
            />
          </div>
          <div className="col-span-2 sm:row-start-2 sm:row-end-3">
            <StatsCard
              title="Orders"
              description="Total Orders"
              stats={1246}
              profitPercentage={5.5}
              profitNumber={-15}
              type="des"
              sign="number"
            />
          </div>
          <div className="col-span-4 sm:col-span-3 sm:row-span-3">
            <ChartContainer
              className="h-full max-h-[240px] w-full"
              config={chartConfig}
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{
                  top: 20,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={true}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis
                  dataKey="visitors"
                  tickLine={false}
                  orientation="right"
                  tickMargin={5}
                  axisLine={false}
                  tickFormatter={(value) => value + "k"}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="visitors"
                  fill="var(--color-visitors)"
                  barSize={16}
                  radius={4}
                ></Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
