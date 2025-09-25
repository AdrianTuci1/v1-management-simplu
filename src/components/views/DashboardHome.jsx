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
  XCircle
} from 'lucide-react'
import { useStatistics } from '../../hooks/useStatistics.js'

const DashboardHome = () => {
  const { 
    businessStatistics, 
    recentActivities, 
    loading, 
    error, 
    refresh 
  } = useStatistics()

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
      {/* Error Message - doar când nu avem date */}
      {error && !businessStatistics && !recentActivities?.length && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getKpiData().map((kpi, index) => (
          <div key={index} className="card">
            <div className="card-content p-2">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col items-start text-left">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {kpi.subtitle}
                  </p>
                  <p className="text-3xl font-bold">
                    {loading ? '...' : kpi.value}
                  </p>
                </div>
                <div className={`h-16 w-16 rounded-lg ${kpi.color} flex items-center justify-center`}>
                  <kpi.icon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
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
              <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                {getRecentActivitiesData().map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center ${activity.color}`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      {activity.time && (
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card-footer">
            <button className="btn btn-outline btn-sm">
              Vezi toate activitățile
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <h3 className="card-title">Statistici Rapide</h3>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rata de ocupare</span>
                <span className="text-sm font-medium">85%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Satisfacția clienților</span>
                <span className="text-sm font-medium">4.8/5</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Eficiența operațională</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rata de încasare</span>
                <span className="text-sm font-medium">96%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
            </div>
          </div>
          <div className="card-footer">
            <button className="btn btn-outline btn-sm">
              Vezi rapoarte detaliate
            </button>
          </div>
        </div>
      </div>


    </div>
  )
}

export default DashboardHome
