import { Plus } from 'lucide-react'

import { useDrawer } from '../../contexts/DrawerContext'
import { ChartAreaInteractive } from '../analytics/AreaChart'
import { ChartBarMixed } from '../analytics/BarChartMixed'
import { ChartBarMultiple } from '../analytics/BarChartMultiple'
import { ChartLineMultiple } from '../analytics/LineChartMultiple'


const AnalyticsDashboard = () => {
  const { openDrawer } = useDrawer()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analize</h1>
          <p className="text-muted-foreground">Dashboard analitice și KPI-uri</p>
        </div>
      </div>
      
      {/* Grid pentru chart-uri */}
      <div className="grid gap-6">
        {/* Primul rând - Area Chart */}
        <div className="w-full">
          <ChartAreaInteractive />
        </div>
        
        {/* Al doilea rând - Bar Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <ChartBarMultiple />
          <ChartBarMixed />
        </div>
        
        {/* Al treilea rând - Line Chart */}
        <div className="w-full">
          <ChartLineMultiple />
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
