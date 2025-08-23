import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Package, 
  CreditCard, 
  DollarSign,
  Activity,
  BarChart3,
  Plus
} from 'lucide-react'

import { useDrawer } from '../../contexts/DrawerContext'

const DashboardHome = () => {
  const { openQuickActionsDrawer } = useDrawer()
  const kpiData = [
    {
      title: 'Programări Astăzi',
      value: '12',
      icon: Calendar,
      color: 'bg-blue-500',
      change: '+2',
      changeType: 'positive'
    },
    {
      title: 'Clienți Activi',
      value: '89',
      icon: Users,
      color: 'bg-green-500',
      change: '+5',
      changeType: 'positive'
    },
    {
      title: 'Vânzări Luna',
      value: '45,230 RON',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Produse în Stoc',
      value: '156',
      icon: Package,
      color: 'bg-orange-500',
      change: '-3',
      changeType: 'negative'
    },
    {
      title: 'Facturi Neplătite',
      value: '15',
      icon: CreditCard,
      color: 'bg-red-500',
      change: '+2',
      changeType: 'negative'
    },
    {
      title: 'Încasări Luna',
      value: '38,450 RON',
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+8%',
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
                      onClick={openQuickActionsDrawer}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Acțiune rapidă
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi, index) => (
          <div key={index} className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-lg ${kpi.color} flex items-center justify-center`}>
                  <kpi.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.change}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  vs luna trecută
                </span>
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
