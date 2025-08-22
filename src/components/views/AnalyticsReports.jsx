import { BarChart3, Plus } from 'lucide-react'

import { useDrawer } from '../../contexts/DrawerContext'

const AnalyticsReports = () => {
  const { openDrawer } = useDrawer()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rapoarte</h1>
          <p className="text-muted-foreground">Generează și vizualizează rapoarte</p>
        </div>
        <button onClick={() => openDrawer({ type: 'new-report' })} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Raport nou
        </button>
      </div>
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Secțiunea Rapoarte</h3>
            <p className="text-muted-foreground">Aici vei putea genera și vizualiza rapoarte.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsReports
