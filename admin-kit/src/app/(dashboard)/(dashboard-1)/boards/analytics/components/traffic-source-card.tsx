"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
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

const chartData = [
  { source: "Google", amount: 186 },
  { source: "Social", amount: 305 },
  { source: "Direct", amount: 237 },
]
const chartConfig = {
  amount: {
    label: "Amount",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

type Duration = "month" | "week"

export default function TrafficSourceCard() {
  const [duration, setDuration] = useState<Duration>("week")
  return (
    <Card className="h-full w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Traffic Source</CardTitle>
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
        <CardDescription>
          Gain insights into where your visitors are coming from.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="max-h-[200px] w-full" config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="source"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <XAxis
              axisLine={false}
              tickLine={false}
              dataKey="amount"
              tickFormatter={(value) => value + "k"}
              type="number"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="amount"
              layout="vertical"
              fill="var(--color-amount)"
              barSize={14}
              radius={4}
            >
              <LabelList
                dataKey="amount"
                position="right"
                offset={4}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
