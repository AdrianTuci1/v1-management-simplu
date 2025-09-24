"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts"

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

export const description = "Programări pe baza genului"

const chartData = [
  { month: "Ianuarie", barbati: 186, femei: 220 },
  { month: "Februarie", barbati: 305, femei: 280 },
  { month: "Martie", barbati: 237, femei: 260 },
  { month: "Aprilie", barbati: 273, femei: 290 },
  { month: "Mai", barbati: 209, femei: 240 },
  { month: "Iunie", barbati: 214, femei: 230 },
]

const chartConfig = {
  barbati: {
    label: "Bărbați",
    color: "var(--chart-1)",
  },
  femei: {
    label: "Femei",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartBarMultiple() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Programări pe baza genului</CardTitle>
        <CardDescription>Ianuarie - Iunie 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <Tooltip />
              <Bar dataKey="barbati" fill="var(--color-barbati)" radius={4} />
              <Bar dataKey="femei" fill="var(--color-femei)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Creștere cu 3.8% această lună <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Prezentarea programărilor pe baza genului în ultimele 6 luni
        </div>
      </CardFooter>
    </Card>
  )
}
