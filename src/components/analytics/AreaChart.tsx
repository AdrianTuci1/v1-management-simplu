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
import { useAppointments, Appointment } from "../../hooks/useAppointments"

// Type definitions
interface ProcessedData {
  date: string
  realizate: number
  anulate: number
}

export const description = "An interactive area chart showing completed vs cancelled appointments"

// Generate sample data for the last 3 months
const generateAppointmentData = () => {
  const data = []
  const today = new Date()
  const threeMonthsAgo = new Date(today)
  threeMonthsAgo.setMonth(today.getMonth() - 3)
  
  for (let d = new Date(threeMonthsAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dayOfWeek = d.getDay()
    
    // More appointments on weekdays, fewer on weekends
    const baseCompleted = dayOfWeek >= 1 && dayOfWeek <= 5 ? 
      Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 8) + 2
    const baseCancelled = Math.floor(Math.random() * 5) + 1
    
    data.push({
      date: dateStr,
      realizate: baseCompleted,
      anulate: baseCancelled
    })
  }
  
  return data
}

const chartData = generateAppointmentData()

const chartConfig = {
  realizate: {
    label: "Programări realizate",
    color: "var(--chart-1)",
  },
  anulate: {
    label: "Programări anulate",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig
export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState("90d")
  const { appointments } = useAppointments()
  
  // Process real appointment data
  const processedData = React.useMemo((): ProcessedData[] => {
    if (!appointments || appointments.length === 0) {
      return chartData // fallback to sample data
    }
    
    // Group appointments by date
    const appointmentsByDate: Record<string, { realizate: number; anulate: number }> = {}
    appointments.forEach((appointment: Appointment) => {
      const date = appointment.date || appointment.startDate
      if (!date) return
      
      if (!appointmentsByDate[date]) {
        appointmentsByDate[date] = { realizate: 0, anulate: 0 }
      }
      
      // Check if appointment is completed or cancelled
      if (appointment.status === 'completed' || appointment.status === 'realizata') {
        appointmentsByDate[date].realizate++
      } else if (appointment.status === 'cancelled' || appointment.status === 'anulata') {
        appointmentsByDate[date].anulate++
      }
    })
    
    // Convert to array and sort by date
    return Object.entries(appointmentsByDate)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [appointments])
  
  const filteredData = processedData.filter((item) => {
    const date = new Date(item.date)
    const today = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })
  
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Programări realizate vs anulate</CardTitle>
          <CardDescription>
            Evoluția programărilor în ultimele 3 luni
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Ultimele 3 luni" />
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
                return date.toLocaleDateString("ro-RO", {
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
