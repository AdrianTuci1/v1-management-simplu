"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

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

export const description = "Programări per medic"

const chartData = [
  { doctor: "dr_popescu", appointments: 275, fill: "var(--color-dr_popescu)" },
  { doctor: "dr_ionescu", appointments: 200, fill: "var(--color-dr_ionescu)" },
  { doctor: "dr_marin", appointments: 187, fill: "var(--color-dr_marin)" },
  { doctor: "dr_stoica", appointments: 173, fill: "var(--color-dr_stoica)" },
  { doctor: "dr_radulescu", appointments: 90, fill: "var(--color-dr_radulescu)" },
]

const chartConfig = {
  appointments: {
    label: "Programări",
  },
  dr_popescu: {
    label: "Dr. Popescu",
    color: "var(--chart-1)",
  },
  dr_ionescu: {
    label: "Dr. Ionescu",
    color: "var(--chart-2)",
  },
  dr_marin: {
    label: "Dr. Marin",
    color: "var(--chart-3)",
  },
  dr_stoica: {
    label: "Dr. Stoica",
    color: "var(--chart-4)",
  },
  dr_radulescu: {
    label: "Dr. Rădulescu",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function ChartBarMixed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Programări per medic</CardTitle>
        <CardDescription>Ianuarie - Iunie 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{
                left: 0,
              }}
            >
              <YAxis
                dataKey="doctor"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) =>
                  chartConfig[value as keyof typeof chartConfig]?.label
                }
              />
              <XAxis dataKey="appointments" type="number" hide />
              <Tooltip />
              <Bar dataKey="appointments" radius={5} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Dr. Popescu are cele mai multe programări <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Distribuția programărilor pe medici în ultimele 6 luni
        </div>
      </CardFooter>
    </Card>
  )
}
