"use client"
import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
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
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
export const description = "Programări realizate vs anulate"
const chartData = [
  { date: "2024-04-01", realizate: 45, anulate: 8 },
  { date: "2024-04-02", realizate: 32, anulate: 5 },
  { date: "2024-04-03", realizate: 38, anulate: 12 },
  { date: "2024-04-04", realizate: 52, anulate: 6 },
  { date: "2024-04-05", realizate: 67, anulate: 9 },
  { date: "2024-04-06", realizate: 58, anulate: 7 },
  { date: "2024-04-07", realizate: 41, anulate: 4 },
  { date: "2024-04-08", realizate: 73, anulate: 11 },
  { date: "2024-04-09", realizate: 28, anulate: 3 },
  { date: "2024-04-10", realizate: 49, anulate: 8 },
  { date: "2024-04-11", realizate: 62, anulate: 9 },
  { date: "2024-04-12", realizate: 55, anulate: 7 },
  { date: "2024-04-13", realizate: 68, anulate: 10 },
  { date: "2024-04-14", realizate: 34, anulate: 5 },
  { date: "2024-04-15", realizate: 31, anulate: 6 },
  { date: "2024-04-16", realizate: 35, anulate: 4 },
  { date: "2024-04-17", realizate: 78, anulate: 12 },
  { date: "2024-04-18", realizate: 71, anulate: 8 },
  { date: "2024-04-19", realizate: 48, anulate: 7 },
  { date: "2024-04-20", realizate: 23, anulate: 3 },
  { date: "2024-04-21", realizate: 36, anulate: 5 },
  { date: "2024-04-22", realizate: 42, anulate: 6 },
  { date: "2024-04-23", realizate: 39, anulate: 8 },
  { date: "2024-04-24", realizate: 71, anulate: 9 },
  { date: "2024-04-25", realizate: 44, anulate: 6 },
  { date: "2024-04-26", realizate: 19, anulate: 4 },
  { date: "2024-04-27", realizate: 72, anulate: 11 },
  { date: "2024-04-28", realizate: 29, anulate: 5 },
  { date: "2024-04-29", realizate: 58, anulate: 7 },
  { date: "2024-04-30", realizate: 81, anulate: 12 },
  { date: "2024-05-01", realizate: 35, anulate: 6 },
  { date: "2024-05-02", realizate: 56, anulate: 8 },
  { date: "2024-05-03", realizate: 47, anulate: 7 },
  { date: "2024-05-04", realizate: 73, anulate: 10 },
  { date: "2024-05-05", realizate: 89, anulate: 13 },
  { date: "2024-05-06", realizate: 94, anulate: 15 },
  { date: "2024-05-07", realizate: 71, anulate: 9 },
  { date: "2024-05-08", realizate: 32, anulate: 5 },
  { date: "2024-05-09", realizate: 44, anulate: 6 },
  { date: "2024-05-10", realizate: 56, anulate: 8 },
  { date: "2024-05-11", realizate: 63, anulate: 7 },
  { date: "2024-05-12", realizate: 38, anulate: 6 },
  { date: "2024-05-13", realizate: 39, anulate: 4 },
  { date: "2024-05-14", realizate: 82, anulate: 12 },
  { date: "2024-05-15", realizate: 87, anulate: 11 },
  { date: "2024-05-16", realizate: 64, anulate: 9 },
  { date: "2024-05-17", realizate: 91, anulate: 13 },
  { date: "2024-05-18", realizate: 58, anulate: 8 },
  { date: "2024-05-19", realizate: 43, anulate: 6 },
  { date: "2024-05-20", realizate: 34, anulate: 5 },
  { date: "2024-05-21", realizate: 19, anulate: 3 },
  { date: "2024-05-22", realizate: 18, anulate: 2 },
  { date: "2024-05-23", realizate: 52, anulate: 8 },
  { date: "2024-05-24", realizate: 58, anulate: 7 },
  { date: "2024-05-25", realizate: 41, anulate: 6 },
  { date: "2024-05-26", realizate: 43, anulate: 5 },
  { date: "2024-05-27", realizate: 84, anulate: 12 },
  { date: "2024-05-28", realizate: 46, anulate: 6 },
  { date: "2024-05-29", realizate: 18, anulate: 3 },
  { date: "2024-05-30", realizate: 68, anulate: 9 },
  { date: "2024-05-31", realizate: 37, anulate: 6 },
  { date: "2024-06-01", realizate: 38, anulate: 5 },
  { date: "2024-06-02", realizate: 89, anulate: 13 },
  { date: "2024-06-03", realizate: 22, anulate: 4 },
  { date: "2024-06-04", realizate: 84, anulate: 11 },
  { date: "2024-06-05", realizate: 20, anulate: 3 },
  { date: "2024-06-06", realizate: 59, anulate: 8 },
  { date: "2024-06-07", realizate: 63, anulate: 9 },
  { date: "2024-06-08", realizate: 74, anulate: 10 },
  { date: "2024-06-09", realizate: 83, anulate: 12 },
  { date: "2024-06-10", realizate: 33, anulate: 5 },
  { date: "2024-06-11", realizate: 21, anulate: 4 },
  { date: "2024-06-12", realizate: 92, anulate: 14 },
  { date: "2024-06-13", realizate: 19, anulate: 3 },
  { date: "2024-06-14", realizate: 81, anulate: 11 },
  { date: "2024-06-15", realizate: 61, anulate: 9 },
  { date: "2024-06-16", realizate: 72, anulate: 10 },
  { date: "2024-06-17", realizate: 89, anulate: 13 },
  { date: "2024-06-18", realizate: 24, anulate: 4 },
  { date: "2024-06-19", realizate: 68, anulate: 8 },
  { date: "2024-06-20", realizate: 78, anulate: 11 },
  { date: "2024-06-21", realizate: 35, anulate: 6 },
  { date: "2024-06-22", realizate: 63, anulate: 9 },
  { date: "2024-06-23", realizate: 91, anulate: 14 },
  { date: "2024-06-24", realizate: 28, anulate: 4 },
  { date: "2024-06-25", realizate: 31, anulate: 5 },
  { date: "2024-06-26", realizate: 83, anulate: 12 },
  { date: "2024-06-27", realizate: 86, anulate: 13 },
  { date: "2024-06-28", realizate: 32, anulate: 5 },
  { date: "2024-06-29", realizate: 23, anulate: 4 },
  { date: "2024-06-30", realizate: 84, anulate: 11 },
]
const chartConfig = {
  realizate: {
    label: "Realizate",
    color: "var(--chart-2)",
  },
  anulate: {
    label: "Anulate",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig
export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState("90d")
  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Programări realizate vs anulate</CardTitle>
          <CardDescription>
            Prezentarea programărilor realizate și anulate în ultimele 3 luni
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Ultimele 3 luni
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Ultimele 30 zile
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Ultimele 7 zile
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="h-[400px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillRealizate" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-realizate)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-realizate)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillAnulate" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-anulate)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-anulate)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <Tooltip />
            <Area
              dataKey="anulate"
              type="natural"
              fill="url(#fillAnulate)"
              stroke="var(--color-anulate)"
              stackId="a"
            />
            <Area
              dataKey="realizate"
              type="natural"
              fill="url(#fillRealizate)"
              stroke="var(--color-realizate)"
              stackId="a"
            />
            <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
