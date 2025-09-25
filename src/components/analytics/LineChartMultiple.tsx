"use client"

import React from "react"
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
import { useAppointments, Appointment } from "../../hooks/useAppointments"

export const description = "A multiple line chart showing AI vs Human appointments"

// Generate sample data for AI vs Human appointments
const generateAIVsHumanData = () => {
  const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun"]
  return months.map(month => ({
    month,
    ai: Math.floor(Math.random() * 30) + 10,
    umane: Math.floor(Math.random() * 50) + 20
  }))
}

const chartData = generateAIVsHumanData()

const chartConfig = {
  ai: {
    label: "Programări AI",
    color: "var(--chart-1)",
  },
  umane: {
    label: "Programări umane",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartLineMultiple() {
  const { appointments } = useAppointments()
  
  // Process real appointment data by AI vs Human
  const processedData = React.useMemo(() => {
    if (!appointments || appointments.length === 0) {
      return chartData // fallback to sample data
    }
    
    // Group appointments by month and type (AI vs Human)
    const appointmentsByMonth = {}
    appointments.forEach(appointment => {
      const date = new Date(appointment.date || appointment.startDate)
      if (!date) return
      
      const monthKey = date.toLocaleDateString('ro-RO', { month: 'short' })
      const monthIndex = date.getMonth()
      
      if (!appointmentsByMonth[monthKey]) {
        appointmentsByMonth[monthKey] = { 
          month: monthKey, 
          ai: 0, 
          umane: 0,
          monthIndex 
        }
      }
      
      // Determine if appointment is AI or human based on source or type
      const isAI = appointment.source === 'ai' || 
                   appointment.type === 'ai' || 
                   appointment.assistant === 'ai' ||
                   appointment.bookingMethod === 'ai'
      
      if (isAI) {
        appointmentsByMonth[monthKey].ai++
      } else {
        appointmentsByMonth[monthKey].umane++
      }
    })
    
    // Convert to array and sort by month
    return Object.values(appointmentsByMonth)
      .sort((a, b) => a.monthIndex - b.monthIndex)
      .map(({ monthIndex, ...rest }) => rest)
  }, [appointments])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Programări AI vs umane</CardTitle>
        <CardDescription>Comparația între programările AI și cele umane</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart accessibilityLayer data={processedData}>
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
                dataKey="ai" 
                type="monotone" 
                stroke="var(--color-ai)" 
                strokeWidth={2}
                dot={{ fill: "var(--color-ai)" }}
              />
              <Line 
                dataKey="umane" 
                type="monotone" 
                stroke="var(--color-umane)" 
                strokeWidth={2}
                dot={{ fill: "var(--color-umane)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Creștere AI în programări <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Evoluția programărilor AI vs umane în ultimele 6 luni
        </div>
      </CardFooter>
    </Card>
  )
}
