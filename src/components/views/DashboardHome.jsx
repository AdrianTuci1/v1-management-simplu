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



const DashboardHome = () => {

  
  // Get current month name in Romanian
  const getCurrentMonthName = () => {
    const months = [
      'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
      'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
    ]
    return months[new Date().getMonth()]
  }

  const kpiData = [
    {
      title: 'Pacienți Înregistrați',
      subtitle: `Luna ${getCurrentMonthName()}`,
      value: '24',
      icon: Users,
      color: 'bg-blue-500',
      change: '+3',
      changeType: 'positive'
    },
    {
      title: 'Vizite Programate',
      subtitle: `Luna ${getCurrentMonthName()}`,
      value: '156',
      icon: Calendar,
      color: 'bg-green-500',
      change: '+12',
      changeType: 'positive'
    },
    {
      title: 'Vizite Finalizate',
      subtitle: `Luna ${getCurrentMonthName()}`,
      value: '142',
      icon: CheckCircle,
      color: 'bg-emerald-500',
      change: '+8',
      changeType: 'positive'
    },
    {
      title: 'Vizite Anulate',
      subtitle: `Luna ${getCurrentMonthName()}`,
      value: '8',
      icon: XCircle,
      color: 'bg-red-500',
      change: '-2',
      changeType: 'positive'
    }
  ]

  const recentActivities = [
    {
      type: 'appointment',
      title: 'Programare nouă',
      description: 'Ion Marinescu - Control de rutină',
      time: 'Acum 5 minute',
      icon: Calendar,
      color: 'text-blue-500'
    },
    {
      type: 'sale',
      title: 'Vânzare completată',
      description: 'Obturație compusă - 350 RON',
      time: 'Acum 15 minute',
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      type: 'payment',
      title: 'Plată primită',
      description: 'Factura #2024-001 - 350 RON',
      time: 'Acum 30 minute',
      icon: CreditCard,
      color: 'text-emerald-500'
    },
    {
      type: 'inventory',
      title: 'Stoc actualizat',
      description: 'Materiale dentare - 5 unități rămase',
      time: 'Acum 1 oră',
      icon: Package,
      color: 'text-orange-500'
    }
  ]

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div key={index} className="card">
            <div className="card-conten p-2">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col items-start text-left">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {kpi.subtitle}
                  </p>
                  <p className="text-3xl font-bold">{kpi.value}</p>
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
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-full bg-muted flex items-center justify-center ${activity.color}`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
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
