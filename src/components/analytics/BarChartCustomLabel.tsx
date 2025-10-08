"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, ResponsiveContainer } from "recharts"

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
} from "@/components/ui/chart"

export const description = "A bar chart with a custom label"

const defaultChartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

interface ChartBarLabelCustomProps {
  title?: string;
  description?: string;
  data?: Array<{ treatment: string; count: number }>;
  dataKey?: string;
  nameKey?: string;
}

export function ChartBarLabelCustom({ 
  title = "Bar Chart - Custom Label", 
  description = "January - June 2024",
  data,
  dataKey = "desktop",
  nameKey = "month"
}: ChartBarLabelCustomProps) {
  // Transform treatment data to chart format if provided
  const chartData = data 
    ? data.map(item => ({
        [nameKey]: item.treatment,
        [dataKey]: item.count
      }))
    : defaultChartData

  const chartConfig = {
    [dataKey]: {
      label: dataKey === "count" ? "Număr" : dataKey === "desktop" ? "Desktop" : "Valoare",
      color: "hsl(221.2 83.2% 53.3%)",
    },
    label: {
      color: "hsl(var(--background))",
    },
  } satisfies ChartConfig
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
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
                dataKey={nameKey}
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                hide
              />
              <XAxis dataKey={dataKey} type="number" hide />
              <Bar
                dataKey={dataKey}
                fill="hsl(221.2 83.2% 53.3%)"
                radius={4}
              >
                <LabelList
                  dataKey={nameKey}
                  position="insideLeft"
                  offset={8}
                  className="fill-background"
                  fontSize={12}
                />
                <LabelList
                  dataKey={dataKey}
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
