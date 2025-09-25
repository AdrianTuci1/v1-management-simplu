"use client"

import React from "react"
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
import { useAppointments, Appointment } from "../../hooks/useAppointments"

// Type definitions
interface DoctorData {
  doctor: string
  appointments: number
  fill: string
}

export const description = "A mixed bar chart showing doctors with appointment counts"

// Generate sample data for doctors
const generateDoctorData = () => {
  const doctors = [
    { name: "Dr. Popescu", appointments: 45 },
    { name: "Dr. Ionescu", appointments: 38 },
    { name: "Dr. Georgescu", appointments: 32 },
    { name: "Dr. Marinescu", appointments: 28 },
    { name: "Dr. Dumitrescu", appointments: 22 }
  ]
  
  return doctors.map(doctor => ({
    doctor: doctor.name,
    appointments: doctor.appointments,
    fill: "var(--color-doctor)"
  }))
}

const chartData = generateDoctorData()

const chartConfig = {
  appointments: {
    label: "Programări",
  },
  doctor: {
    label: "Doctor",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartBarMixed() {
  const { appointments } = useAppointments()
  
  // Process real appointment data by doctor
  const processedData = React.useMemo((): DoctorData[] => {
    if (!appointments || appointments.length === 0) {
      return chartData // fallback to sample data
    }
    
    // Group appointments by doctor
    const appointmentsByDoctor: Record<string, DoctorData> = {}
    appointments.forEach((appointment: Appointment) => {
      const doctor = appointment.doctor || appointment.medic
      if (!doctor) return
      
      const doctorName = doctor.name || doctor.fullName || `Dr. ${doctor.firstName} ${doctor.lastName}` || 'Doctor necunoscut'
      
      if (!appointmentsByDoctor[doctorName]) {
        appointmentsByDoctor[doctorName] = {
          doctor: doctorName,
          appointments: 0,
          fill: "var(--color-doctor)"
        }
      }
      
      appointmentsByDoctor[doctorName].appointments++
    })
    
    // Convert to array and sort by appointment count
    return Object.values(appointmentsByDoctor)
      .sort((a: DoctorData, b: DoctorData) => b.appointments - a.appointments)
      .slice(0, 5) // Show top 5 doctors
  }, [appointments])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Medici cu numărul de programări</CardTitle>
        <CardDescription>Top 5 medici după numărul de programări</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              accessibilityLayer
              data={processedData}
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
                tickFormatter={(value) => value}
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
          Top medici după activitate <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Afișarea celor mai activi medici din clinică
        </div>
      </CardFooter>
    </Card>
  )
}
