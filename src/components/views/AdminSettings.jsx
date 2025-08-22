import { Settings, Plus } from 'lucide-react'

const AdminSettings = ({ onDrawerOpen }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Setări</h1>
          <p className="text-muted-foreground">Configurează sistemul</p>
        </div>
        <button onClick={() => onDrawerOpen({ type: 'new-setting' })} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Setare nouă
        </button>
      </div>
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Secțiunea Setări</h3>
            <p className="text-muted-foreground">Aici vei putea configura sistemul.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
