import { DollarSign, Plus } from 'lucide-react'

import { useDrawer } from '../../contexts/DrawerContext'

const FinancialAccounting = () => {
  const { openDrawer } = useDrawer()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contabilitate</h1>
          <p className="text-muted-foreground">Gestionează contabilitatea</p>
        </div>
        <button onClick={() => openDrawer({ type: 'new-transaction' })} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Tranzacție nouă
        </button>
      </div>
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Secțiunea Contabilitate</h3>
            <p className="text-muted-foreground">Aici vei putea gestiona contabilitatea.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinancialAccounting
