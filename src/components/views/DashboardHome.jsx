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
    error, 
    refresh 
  } = useStatistics()

  // Chart data and config for website bookings
  const websiteChartData = [
    { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
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

  // Chart data for doctor progress
  const doctorProgressData = [
    { doctor: "Dr. Popescu", progress: 75, fill: "var(--chart-1)" },
    { doctor: "Dr. Ionescu", progress: 60, fill: "var(--chart-2)" },
    { doctor: "Dr. Georgescu", progress: 85, fill: "var(--chart-3)" },
    { doctor: "Dr. Marinescu", progress: 45, fill: "var(--chart-4)" },
  ]

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

  // Transform business statistics to KPI format
  const getKpiData = () => {
    if (!businessStatistics) {
      return [
        {
          title: 'Pacienți Înregistrați',
          subtitle: `Luna ${getCurrentMonthName()}`,
          value: '0',
          icon: Users,
          color: 'bg-blue-500',
          change: '0',
          changeType: 'neutral'
        },
        {
          title: 'Vizite Programate',
          subtitle: `Luna ${getCurrentMonthName()}`,
          value: '0',
          icon: Calendar,
          color: 'bg-green-500',
          change: '0',
          changeType: 'neutral'
        },
        {
          title: 'Vizite Finalizate',
          subtitle: `Luna ${getCurrentMonthName()}`,
          value: '0',
          icon: CheckCircle,
          color: 'bg-emerald-500',
          change: '0',
          changeType: 'neutral'
        },
        {
          title: 'Vizite Anulate',
          subtitle: `Luna ${getCurrentMonthName()}`,
          value: '0',
          icon: XCircle,
          color: 'bg-red-500',
          change: '0',
          changeType: 'neutral'
        }
      ]
    }

    return [
      {
        title: 'Pacienți Înregistrați',
        subtitle: `Total: ${businessStatistics.totalPatients || 0}`,
        value: businessStatistics.activePatients?.toString() || '0',
        icon: Users,
        color: 'bg-blue-500',
        change: '+0',
        changeType: 'positive'
      },
      {
        title: 'Programări Totale',
        subtitle: `Luna ${getCurrentMonthName()}`,
        value: businessStatistics.totalAppointments?.toString() || '0',
        icon: Calendar,
        color: 'bg-green-500',
        change: '+0',
        changeType: 'positive'
      },
      {
        title: 'Programări Finalizate',
        subtitle: `Luna ${getCurrentMonthName()}`,
        value: businessStatistics.appointmentStats?.completed?.toString() || '0',
        icon: CheckCircle,
        color: 'bg-emerald-500',
        change: '+0',
        changeType: 'positive'
      },
      {
        title: 'Programări Anulate',
        subtitle: `Luna ${getCurrentMonthName()}`,
        value: businessStatistics.appointmentStats?.cancelled?.toString() || '0',
        icon: XCircle,
        color: 'bg-red-500',
        change: '0',
        changeType: 'neutral'
      }
    ]
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
          case 'patient':
            return { icon: Users, color: 'text-green-500' }
          case 'payment':
            return { icon: CreditCard, color: 'text-emerald-500' }
          case 'sale':
            return { icon: TrendingUp, color: 'text-green-500' }
          case 'inventory':
            return { icon: Package, color: 'text-orange-500' }
          default:
            return { icon: Activity, color: 'text-gray-500' }
        }
      }

      const config = getActivityConfig(activity.type)
      
      // Format time
      const formatTime = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffInMinutes = Math.floor((now - date) / (1000 * 60))
        
        if (diffInMinutes < 1) return 'Acum câteva secunde'
        if (diffInMinutes < 60) return `Acum ${diffInMinutes} minute`
        if (diffInMinutes < 1440) return `Acum ${Math.floor(diffInMinutes / 60)} ore`
        return `Acum ${Math.floor(diffInMinutes / 1440)} zile`
      }

      return {
        type: activity.type,
        title: activity.title || 'Activitate',
        description: activity.subtitle || 'Activitate în sistem',
        time: formatTime(activity.timestamp),
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
                    {loading ? '...' : businessStatistics?.totalAppointments || '0'}
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
                    {loading ? '...' : businessStatistics?.appointmentStats?.completed || '0'}
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
                    {loading ? '...' : businessStatistics?.appointmentStats?.cancelled || '0'}
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
                    {loading ? '...' : businessStatistics?.totalPatients || '0'}
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
                    {loading ? '...' : '12.5k'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Încasări RON</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tratamente Efectuate */}
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
                    {loading ? '...' : '47'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Tratamente</p>
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
                    <p className="text-xl font-bold">4.8</p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${star <= 4 ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">127 recenzii</p>
                </div>

                {/* SMS-uri Trimise */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <p className="text-sm font-medium">SMS-uri</p>
                    </div>
                    <p className="text-xl font-bold">234</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">78% limită</p>
                </div>

                {/* Grad de Ocupare */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-green-500" />
                      <p className="text-sm font-medium">Ocupare</p>
                    </div>
                    <p className="text-xl font-bold">85%</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">Foarte bine</p>
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
              <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2">
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
