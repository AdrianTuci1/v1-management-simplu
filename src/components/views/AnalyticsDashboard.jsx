import { PieChart, Plus } from 'lucide-react'

import { useDrawer } from '../../contexts/DrawerContext'

const AnalyticsDashboard = () => {
  const { openDrawer } = useDrawer()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analize</h1>
          <p className="text-muted-foreground">Dashboard analitice și KPI-uri</p>
        </div>
        <button onClick={() => openDrawer({ type: 'new-analytics' })} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Analiză nouă
        </button>
      </div>
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Secțiunea Analize</h3>
            <p className="text-muted-foreground">Aici vei putea vizualiza dashboard-uri analitice și KPI-uri.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
