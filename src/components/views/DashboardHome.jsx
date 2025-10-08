import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Package, 
  CreditCard, 
  DollarSign,
  Activity,
  BarChart3,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MessageSquare,
  Percent
} from 'lucide-react'
import { useStatistics } from '../../hooks/useStatistics.js'
import { ChartBarLabelCustom } from '../analytics/BarChartCustomLabel'
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer } from '../ui/chart'

const DashboardHome = () => {
  const { 
    businessStatistics, 
    recentActivities, 
    loading, 
  } = useStatistics()

  /**
   * Exemple de structură pentru businessStatistics:
   * {
   *   totalAppointments: 150,
   *   totalPatients: 423,
   *   appointmentStats: {
   *     completed: 120,
   *     cancelled: 15,
   *     pending: 15,
   *     absent: 47
   *   },
   *   appointmentsToday: [
   *     { id: 1, patientName: 'Ion Popescu', time: '10:00', status: 'confirmed' },
   *     { id: 2, patientName: 'Maria Ionescu', time: '11:00', status: 'pending' }
   *   ],
   *   revenue: {
   *     monthly: 12500,
   *   },
   *   websiteBookings: 200,
   *   clinicRating: {
   *     average: 4.8,
   *     totalReviews: 127
   *   },
   *   smsStats: {
   *     sent: 234,
   *     limit: 300,
   *     percentage: 78
   *   },
   *   occupancyRate: 85,
   *   doctorProgress: [
   *     { doctor: 'Dr. Popescu', progress: 75, appointments: 12 },
   *     { doctor: 'Dr. Ionescu', progress: 60, appointments: 8 },
   *     { doctor: 'Dr. Georgescu', progress: 85, appointments: 15 },
   *     { doctor: 'Dr. Marinescu', progress: 45, appointments: 6 }
   *   ],
   *   popularTreatments: [
   *     { treatment: 'Detartraj', count: 45 },
   *     { treatment: 'Obturație', count: 38 },
   *     { treatment: 'Consultație', count: 67 },
   *     { treatment: 'Tratament canal', count: 23 },
   *     { treatment: 'Albire dentară', count: 15 }
   *   ]
   * }
   */

  // Helper function to safely extract numeric value
  const extractNumber = (value) => {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? 0 : parsed
    }
    if (typeof value === 'object' && value.value !== undefined) return extractNumber(value.value)
    if (typeof value === 'object' && value.count !== undefined) return extractNumber(value.count)
    return 0
  }

  // Safe getters pentru datele din businessStatistics
  const getTotalAppointments = () => {
    return extractNumber(businessStatistics?.totalAppointments)
  }

  const getTotalPatients = () => {
    return extractNumber(businessStatistics?.totalPatients)
  }

  const getCompletedAppointments = () => {
    return extractNumber(businessStatistics?.appointmentStats?.completed)
  }

  const getCancelledAppointments = () => {
    return extractNumber(businessStatistics?.appointmentStats?.cancelled)
  }

  const getPendingAppointments = () => {
    return extractNumber(businessStatistics?.appointmentStats?.pending)
  }

  const getAppointmentsToday = () => {
    return Array.isArray(businessStatistics?.appointmentsToday) 
      ? businessStatistics.appointmentsToday 
      : []
  }

  const getMonthlyRevenue = () => {
    return extractNumber(businessStatistics?.revenue?.monthly)
  }

  const getAbsentAppointments = () => {
    return extractNumber(businessStatistics?.appointmentStats?.absent)
  }

  const getWebsiteBookings = () => {
    return extractNumber(businessStatistics?.websiteBookings)
  }

  const getClinicRating = () => {
    return {
      average: extractNumber(businessStatistics?.clinicRating?.average),
      totalReviews: extractNumber(businessStatistics?.clinicRating?.totalReviews)
    }
  }

  const getSmsStats = () => {
    return {
      sent: extractNumber(businessStatistics?.smsStats?.sent),
      limit: extractNumber(businessStatistics?.smsStats?.limit),
      percentage: extractNumber(businessStatistics?.smsStats?.percentage)
    }
  }

  const getOccupancyRate = () => {
    return extractNumber(businessStatistics?.occupancyRate)
  }

  const getDoctorProgress = () => {
    if (!Array.isArray(businessStatistics?.doctorProgress) || businessStatistics.doctorProgress.length === 0) {
      // Date default dacă nu există date din backend
      return [
        { doctor: "Dr. Popescu", progress: 75, appointments: 12, fill: "var(--chart-1)" },
        { doctor: "Dr. Ionescu", progress: 60, appointments: 8, fill: "var(--chart-2)" },
        { doctor: "Dr. Georgescu", progress: 85, appointments: 15, fill: "var(--chart-3)" },
        { doctor: "Dr. Marinescu", progress: 45, appointments: 6, fill: "var(--chart-4)" },
      ]
    }
    
    // Elimină duplicate și adaugă culori pentru chart
    const uniqueDoctors = new Map()
    
    businessStatistics.doctorProgress.forEach((doc) => {
      const doctorName = typeof doc.doctor === 'string' ? doc.doctor : (doc.doctor?.name || doc.doctor?.id || 'Doctor')
      
      if (!uniqueDoctors.has(doctorName)) {
        uniqueDoctors.set(doctorName, {
          doctor: doctorName,
          progress: extractNumber(doc.progress),
          appointments: extractNumber(doc.appointments)
        })
      }
    })
    
    // Convertește Map la array și adaugă culori
    return Array.from(uniqueDoctors.values()).map((doc, index) => ({
      ...doc,
      fill: `var(--chart-${(index % 5) + 1})`
    }))
  }

  const getPopularTreatments = () => {
    if (!Array.isArray(businessStatistics?.popularTreatments) || businessStatistics.popularTreatments.length === 0) {
      // Date default dacă nu există date din backend
      return [
        { treatment: "Consultație", count: 67 },
        { treatment: "Detartraj", count: 45 },
        { treatment: "Obturație", count: 38 },
        { treatment: "Tratament canal", count: 23 },
        { treatment: "Albire dentară", count: 15 },
      ]
    }
    // Protejează valorile pentru a evita obiecte în JSX
    return businessStatistics.popularTreatments.map(item => ({
      treatment: typeof item.treatment === 'string' ? item.treatment : (item.treatment?.name || 'Tratament'),
      count: extractNumber(item.count)
    }))
  }

  // Chart data and config for website bookings
  const websiteChartData = [
    { browser: "chrome", visitors: getWebsiteBookings(), fill: "var(--color-safari)" },
  ]

  const websiteChartConfig = {
    visitors: {
      label: "Visitors",
    },
    safari: {
      label: "Safari",
      color: "var(--chart-2)",
    },
  }

  // Chart data for doctor progress - dynamic data
  const doctorProgressData = getDoctorProgress()

  const doctorProgressConfig = {
    progress: {
      label: "Progres",
    },
  }

  // Get current month name in Romanian
  const getCurrentMonthName = () => {
    const months = [
      'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
      'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
    ]
    return months[new Date().getMonth()]
  }



  // Transform recent activities from API format to display format
  const getRecentActivitiesData = () => {
    if (!recentActivities || recentActivities.length === 0) {
      return [
        {
          type: 'no-data',
          title: 'Nu există activități recente',
          description: 'Nu s-au găsit activități în ultima perioadă',
          time: '',
          icon: Activity,
          color: 'text-muted-foreground'
        }
      ]
    }

    return recentActivities.map(activity => {
      // Map activity types to icons and colors
      const getActivityConfig = (activityType) => {
        switch (activityType) {
          case 'appointment':
            return { icon: Calendar, color: 'text-blue-500' }
          case 'treatment':
            return { icon: Activity, color: 'text-indigo-500' }
          case 'patient':
            return { icon: Users, color: 'text-green-500' }
          case 'user':
          case 'medic':
          case 'doctor':
            return { icon: Users, color: 'text-purple-500' }
          case 'invoice':
          case 'payment':
            return { icon: CreditCard, color: 'text-emerald-500' }
          case 'sale':
            return { icon: TrendingUp, color: 'text-green-500' }
          case 'inventory':
          case 'product':
            return { icon: Package, color: 'text-orange-500' }
          default:
            return { icon: Activity, color: 'text-gray-500' }
        }
      }

      const config = getActivityConfig(activity.activityType || activity.type)
      
      // Format time
      const formatTime = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffInMinutes = Math.floor((now - date) / (1000 * 60))
        
        if (diffInMinutes < 1) return 'Acum câteva secunde'
        if (diffInMinutes < 60) return `Acum ${diffInMinutes} minute`
        if (diffInMinutes < 120) return `Acum 1 oră`
        if (diffInMinutes < 1440) return `Acum ${Math.floor(diffInMinutes / 60)} ore`
        return `Acum ${Math.floor(diffInMinutes / 1440)} zile`
      }

      // Helper function to safely extract string value from object or string
      const extractString = (value) => {
        if (!value) return null
        if (typeof value === 'string') return value
        if (typeof value === 'object' && value.name) return value.name
        if (typeof value === 'object' && value.title) return value.title
        return null
      }

      // Build detailed description based on activity type and available data
      const buildDescription = (activity) => {
        const parts = []
        
        // Add action if available
        if (activity.action) {
          parts.push(activity.action)
        }
        
        // Add user/medic/doctor name for user type activities
        const userName = extractString(activity.userName)
        const medicName = extractString(activity.medicName)
        const doctorName = extractString(activity.doctorName)
        
        if (activity.activityType === 'user' || activity.activityType === 'medic' || activity.activityType === 'doctor') {
          const name = userName || medicName || doctorName
          if (name) {
            parts.push(name)
          }
        }
        
        // Add patient name if available (safely extract from object or string)
        const patientName = extractString(activity.patientName)
        if (patientName && activity.activityType !== 'user' && activity.activityType !== 'medic' && activity.activityType !== 'doctor') {
          parts.push(`Pacient: ${patientName}`)
        }
        
        // Add service/treatment name for appointments and treatments (safely extract)
        const serviceName = extractString(activity.serviceName) || extractString(activity.treatmentName) || extractString(activity.treatment)
        if ((activity.activityType === 'appointment' || activity.activityType === 'treatment') && serviceName) {
          parts.push(serviceName)
        }
        
        // Add medic name for appointments (safely extract)
        if (activity.activityType === 'appointment' && medicName) {
          parts.push(medicName)
        }
        
        // Add time for appointments
        if (activity.activityType === 'appointment' && activity.time) {
          parts.push(`Ora: ${activity.time}`)
        }
        
        // Add product name for sales/inventory (check multiple field names)
        const productName = extractString(activity.productName) || 
                           extractString(activity.product) || 
                           extractString(activity.itemName) ||
                           (activity.activityType === 'product' && extractString(activity.serviceName))
        if ((activity.activityType === 'sale' || activity.activityType === 'inventory' || activity.activityType === 'product') && productName) {
          parts.push(productName)
        }

        
        // Add quantity for sales/inventory
        if ((activity.activityType === 'sale' || activity.activityType === 'inventory' || activity.activityType === 'product') && activity.quantity) {
          parts.push(`${activity.quantity} buc`)
        }
        
        // Add amount for invoices/payments/sales/treatments
        const amount = activity.amount || activity.price
        if ((activity.activityType === 'invoice' || activity.activityType === 'payment' || activity.activityType === 'sale' || activity.activityType === 'treatment') && amount) {
          parts.push(`${amount} RON`)
        }

        
        // Add status if available
        if (activity.status) {
          const statusLabels = {
            'scheduled': 'Programat',
            'confirmed': 'Confirmat',
            'completed': 'Finalizat',
            'cancelled': 'Anulat',
            'paid': 'Plătit',
            'unpaid': 'Neplătit',
            'pending': 'În așteptare'
          }
          parts.push(statusLabels[activity.status] || activity.status)
        }
        
        // Fallback to description or default (safely extract)
        if (parts.length === 0) {
          const description = extractString(activity.description) || extractString(activity.subtitle)
          return description || 'Activitate în sistem'
        }
        
        return parts.join(' • ')
      }

      // Generate appropriate title based on activity type
      const getActivityTitle = (activity) => {
        const activityType = activity.activityType || activity.type
        
        switch(activityType) {
          case 'appointment':
            return 'Programare'
          case 'treatment':
            return 'Tratament'
          case 'patient':
            return 'Pacient'
          case 'invoice':
            return 'Factură'
          case 'payment':
            return 'Plată'
          case 'sale':
            return 'Vânzare'
          case 'product':
          case 'inventory':
            return 'Produs'
          case 'user':
          case 'medic':
          case 'doctor':
            return 'Medic'
          default:
            return extractString(activity.title) || 'Activitate'
        }
      }

      return {
        type: activity.activityType || activity.type,
        title: getActivityTitle(activity),
        description: buildDescription(activity),
        time: formatTime(activity.updatedAt || activity.createdAt || activity.timestamp),
        icon: config.icon,
        color: config.color
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Main Grid - 2 columns on large screens, 1 on small/medium */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CASETA 1: KPI Overview - Design modern cu gradient */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Vizite Programate */}
          <div className="card group hover:shadow-lg transition-shadow flex align-center justify-center">
            <div className="card-content p-4 flex align-center justify-center">
              <div className="flex flex-col gap-2 flex align-center justify-center">
                <div className="flex items-center justify-between">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {getCurrentMonthName()}
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {loading ? '...' : getTotalAppointments()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Programate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vizite Realizate */}
          <div className="card group hover:shadow-lg transition-shadow flex align-center justify-center">
            <div className="card-content p-4 flex align-center justify-center">
              <div className="flex flex-col gap-2 flex align-center justify-center">
                <div className="flex items-center justify-between">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {getCurrentMonthName()}
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {loading ? '...' : getCompletedAppointments()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Realizate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vizite Anulate */}
          <div className="card group hover:shadow-lg transition-shadow flex align-center justify-center">
            <div className="card-content p-4 flex align-center justify-center">
              <div className="flex flex-col gap-2 flex align-center justify-center">
                <div className="flex items-center justify-between">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    {getCurrentMonthName()}
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-600">
                    {loading ? '...' : getCancelledAppointments()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Anulate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pacienți Înregistrați */}
          <div className="card group hover:shadow-lg transition-shadow flex align-center justify-center">
            <div className="card-content p-4 flex align-center justify-center">
              <div className="flex flex-col gap-2 flex align-center justify-center">
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    Total
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">
                    {loading ? '...' : getTotalPatients()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Pacienți</p>
                </div>
              </div>
            </div>
          </div>

          {/* Încasări Luna Aceasta */}
          <div className="card group hover:shadow-lg transition-shadow flex align-center justify-center">
            <div className="card-content p-4 flex align-center justify-center">
              <div className="flex flex-col gap-2 flex align-center justify-center">
                <div className="flex items-center justify-between">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {getCurrentMonthName()}
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-600">
                    {loading ? '...' : getMonthlyRevenue().toLocaleString('ro-RO')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Încasări RON</p>
                </div>
              </div>
            </div>
          </div>

          {/* Absete */}
          <div className="card group hover:shadow-lg transition-shadow flex align-center justify-center">
            <div className="card-content p-4 flex align-center justify-center">
              <div className="flex flex-col gap-2 flex align-center justify-center">
                <div className="flex items-center justify-between">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                    {getCurrentMonthName()}
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-600">
                    {loading ? '...' : getAbsentAppointments()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Absenti</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CASETA 2: Programări Website + Metrici în dreapta */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Programări prin website</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
              {/* Chart Radial pentru programări website - mai mic */}
              <div className="flex items-center justify-center">
                <ChartContainer
                  config={websiteChartConfig}
                  className="mx-auto aspect-square h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      data={websiteChartData}
                      startAngle={0}
                      endAngle={250}
                      innerRadius={70}
                      outerRadius={80}
                    >
                      <PolarGrid
                        gridType="circle"
                        radialLines={false}
                        stroke="none"
                        className="first:fill-muted last:fill-background"
                        polarRadius={[76, 64]}
                      />
                      <RadialBar dataKey="visitors" background cornerRadius={10} />
                      <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-3xl font-bold"
                                  >
                                    {websiteChartData[0].visitors.toLocaleString()}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 20}
                                    className="fill-muted-foreground text-sm"
                                  >
                                    Programări
                                  </tspan>
                                </text>
                              )
                            }
                          }}
                        />
                      </PolarRadiusAxis>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              {/* Metrici în dreapta - fără chenare */}
              <div className="space-y-6 flex flex-col justify-center">
                {/* Rating Clinică */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <p className="text-sm font-medium">Rating</p>
                    </div>
                    <p className="text-xl font-bold">{getClinicRating().average.toFixed(1)}</p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${star <= Math.floor(getClinicRating().average) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{getClinicRating().totalReviews} recenzii</p>
                </div>

                {/* SMS-uri Trimise */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <p className="text-sm font-medium">SMS-uri</p>
                    </div>
                    <p className="text-xl font-bold">{getSmsStats().sent}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${getSmsStats().percentage}%` }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">{getSmsStats().percentage}% limită ({getSmsStats().sent}/{getSmsStats().limit})</p>
                </div>

                {/* Grad de Ocupare */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-green-500" />
                      <p className="text-sm font-medium">Ocupare</p>
                    </div>
                    <p className="text-xl font-bold">{getOccupancyRate()}%</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${getOccupancyRate()}%` }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getOccupancyRate() >= 80 ? 'Foarte bine' : getOccupancyRate() >= 60 ? 'Bine' : 'Acceptabil'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CASETA 3: Progress Medici + Tratamente */}
        <div className="space-y-4">
          {/* Chart Radial - Progres Medici cu legendă */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Progresul medicilor azi</h3>
            </div>
            <div className="card-content pb-0">
              <ChartContainer
                config={doctorProgressConfig}
                className="mx-auto aspect-square h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart data={doctorProgressData} innerRadius={30} outerRadius={110}>
                    <RadialBar dataKey="progress" background />
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            {/* Legendă cu medici */}
            <div className="card-footer">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm width-full align-center justify-center">
                {doctorProgressData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: `var(--chart-${index + 1})` }}
                    />
                    <span className="text-muted-foreground">{item.doctor}</span>
                    <span className="font-medium">{item.progress}%</span>
          </div>
        ))}
              </div>
            </div>
          </div>

          {/* Chart Bar - Tratamente Populare */}
          <ChartBarLabelCustom 
            title="Tratamente populare" 
            description="Cele mai solicitate tratamente luna aceasta"
            data={getPopularTreatments()}
            dataKey="count"
            nameKey="treatment"
          />
      </div>

        {/* CASETA 4: Activități Recente */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <h3 className="card-title">Activități Recente</h3>
            </div>
          </div>
          <div className="card-content">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="max-h-[700px] overflow-y-auto space-y-4 pr-2">
                {getRecentActivitiesData().map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center ${activity.color}`}>
                      <activity.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      {activity.time && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card-footer">
            <button className="btn btn-outline btn-sm w-full">
              Vezi toate activitățile
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DashboardHome
