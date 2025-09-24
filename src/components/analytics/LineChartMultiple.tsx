"use client"

import { TrendingUp } from "lucide-react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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

export const description = "Programări manuale vs automate"

const chartData = [
  { month: "Ian", manuale: 186, automate: 80 },
  { month: "Feb", manuale: 305, automate: 200 },
  { month: "Mar", manuale: 237, automate: 120 },
  { month: "Apr", manuale: 273, automate: 190 },
  { month: "Mai", manuale: 209, automate: 230 },
  { month: "Iun", manuale: 214, automate: 240 },
]

const chartConfig = {
  manuale: {
    label: "Manuale",
    color: "var(--chart-1)",
  },
  automate: {
    label: "Automate",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartLineMultiple() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Programări manuale vs automate</CardTitle>
        <CardDescription>Ianuarie - Iunie 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <Tooltip />
              <Line 
                dataKey="manuale" 
                type="monotone" 
                stroke="var(--color-manuale)" 
                strokeWidth={2}
                dot={{ fill: "var(--color-manuale)" }}
              />
              <Line 
                dataKey="automate" 
                type="monotone" 
                stroke="var(--color-automate)" 
                strokeWidth={2}
                dot={{ fill: "var(--color-automate)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Programările automate cresc cu 12.4% <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Comparația între programările manuale și automate în ultimele 6 luni
        </div>
      </CardFooter>
    </Card>
  )
}
