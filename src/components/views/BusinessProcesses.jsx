import { RefreshCw, Plus } from 'lucide-react'
import { useDrawer } from '../../contexts/DrawerContext'

const BusinessProcesses = () => {
  const { openDrawer } = useDrawer();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Procese</h1>
          <p className="text-muted-foreground">Gestionează workflow-urile și procesele</p>
        </div>
        <button onClick={() => openDrawer({ type: 'new-process' })} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Proces nou
        </button>
      </div>
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Secțiunea Procese</h3>
            <p className="text-muted-foreground">Aici vei putea gestiona workflow-urile și procesele.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessProcesses
