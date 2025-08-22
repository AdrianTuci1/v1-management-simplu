import { Activity, Plus, Search, Filter } from 'lucide-react'

const OperationsActivities = ({ onDrawerOpen }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activități</h1>
          <p className="text-muted-foreground">
            Jurnal și istoric activități
          </p>
        </div>
        <button
          onClick={() => onDrawerOpen({ type: 'new-activity' })}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Activitate nouă
        </button>
      </div>

      {/* Content Placeholder */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <h3 className="card-title">Jurnal Activități</h3>
          </div>
        </div>
        <div className="card-content">
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Secțiunea Activități</h3>
            <p className="text-muted-foreground mb-4">
              Aici vei putea vedea jurnalul activităților și istoricul modificărilor.
            </p>
            <button className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Adaugă prima activitate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OperationsActivities
