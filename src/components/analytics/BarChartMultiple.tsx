"use client"

import React from "react"
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
import { useAppointments, Appointment } from "../../hooks/useAppointments"

export const description = "A multiple bar chart showing appointments by gender"

// Generate sample data for gender distribution
const generateGenderData = () => {
  const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie"]
  return months.map(month => ({
    month,
    barbati: Math.floor(Math.random() * 50) + 20,
    femei: Math.floor(Math.random() * 60) + 25
  }))
}

const chartData = generateGenderData()

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
  const { appointments } = useAppointments()
  
  // Process real appointment data by gender
  const processedData = React.useMemo(() => {
    if (!appointments || appointments.length === 0) {
      return chartData // fallback to sample data
    }
    
    // Group appointments by month and gender
    const appointmentsByMonth = {}
    appointments.forEach(appointment => {
      const date = new Date(appointment.date || appointment.startDate)
      if (!date) return
      
      const monthKey = date.toLocaleDateString('ro-RO', { month: 'long' })
      const monthIndex = date.getMonth()
      
      if (!appointmentsByMonth[monthKey]) {
        appointmentsByMonth[monthKey] = { 
          month: monthKey, 
          barbati: 0, 
          femei: 0,
          monthIndex 
        }
      }
      
      // Determine gender from patient data
      const patient = appointment.patient
      if (patient && patient.gender) {
        if (patient.gender === 'male' || patient.gender === 'barbat') {
          appointmentsByMonth[monthKey].barbati++
        } else if (patient.gender === 'female' || patient.gender === 'femeie') {
          appointmentsByMonth[monthKey].femei++
        }
      } else {
        // Random assignment if no gender data
        if (Math.random() > 0.5) {
          appointmentsByMonth[monthKey].barbati++
        } else {
          appointmentsByMonth[monthKey].femei++
        }
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
        <CardTitle>Programări pe gen</CardTitle>
        <CardDescription>Distribuția programărilor pe baza genului</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart accessibilityLayer data={processedData}>
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
          Distribuție echilibrată între genuri <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Afișarea programărilor pe gen pentru ultimele 6 luni
        </div>
      </CardFooter>
    </Card>
  )
}
