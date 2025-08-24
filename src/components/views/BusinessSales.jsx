import { TrendingUp, Plus, DollarSign, CreditCard, Receipt, Calendar } from 'lucide-react'
import { useSalesDrawerStore } from '../../stores/salesDrawerStore'

const BusinessSales = () => {
  const { openSalesDrawer } = useSalesDrawerStore()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vânzări</h1>
          <p className="text-muted-foreground">Gestionează vânzările și tranzacțiile</p>
        </div>
        <button onClick={openSalesDrawer} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Vânzare nouă
        </button>
      </div>

      {/* Statistici rapide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vânzări astăzi</p>
                <p className="text-2xl font-bold">2,450 RON</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tranzacții</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Card</p>
                <p className="text-2xl font-bold">1,200 RON</p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Numerar</p>
                <p className="text-2xl font-bold">1,250 RON</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secțiunea principală */}
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Sistem de Vânzări</h3>
            <p className="text-muted-foreground mb-6">
              Folosește butonul "Vânzare nouă" pentru a deschide sistemul complet de vânzări cu numpad și categorii de produse.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={openSalesDrawer} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Deschide POS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessSales
