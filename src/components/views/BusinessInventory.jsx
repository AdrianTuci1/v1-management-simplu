import { Package, Plus } from 'lucide-react'

const BusinessInventory = ({ onDrawerOpen }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventar</h1>
          <p className="text-muted-foreground">Gestionează stocul și produsele</p>
        </div>
        <button onClick={() => onDrawerOpen({ type: 'new-product' })} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Produs nou
        </button>
      </div>
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Secțiunea Inventar</h3>
            <p className="text-muted-foreground">Aici vei putea gestiona stocul și produsele.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessInventory
