import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Plus, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Calendar,
  Clock,
  Loader2
} from 'lucide-react'
import { useSalesDrawerStore } from '../../stores/salesDrawerStore'
import { useSales } from '../../hooks/useSales'
import { DatePicker } from '../ui/date-picker'

const BusinessSales = () => {
  const { openSalesDrawer } = useSalesDrawerStore()
  const { 
    sales, 
    loading, 
    stats, 
    loadSalesByDate, 
    salesManager 
  } = useSales()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Load sales data when date changes
  useEffect(() => {
    if (selectedDate) {
      loadSalesByDate(selectedDate)
    }
  }, [selectedDate, loadSalesByDate])

  // Filter sales by selected date
  const filteredSales = sales.filter(sale => sale.date === selectedDate)

  // Calculate statistics for selected date
  const currentStats = {
    totalSales: filteredSales.filter(s => s.status === 'completed').length,
    totalRevenue: filteredSales
      .filter(s => s.status === 'completed')
      .reduce((sum, sale) => sum + parseFloat(sale.total), 0),
    cardSales: filteredSales.filter(s => s.status === 'completed' && s.paymentMethod === 'card').length,
    cashSales: filteredSales.filter(s => s.status === 'completed' && s.paymentMethod === 'cash').length,
    cardRevenue: filteredSales
      .filter(s => s.status === 'completed' && s.paymentMethod === 'card')
      .reduce((sum, sale) => sum + parseFloat(sale.total), 0),
    cashRevenue: filteredSales
      .filter(s => s.status === 'completed' && s.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + parseFloat(sale.total), 0)
  }

  const getStatusBadge = (status) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${salesManager.getStatusClass(status)}`}>
        {salesManager.getStatusLabel(status)}
      </span>
    )
  }

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'card': return <CreditCard className="h-4 w-4" />
      case 'cash': return <DollarSign className="h-4 w-4" />
      default: return <Receipt className="h-4 w-4" />
    }
  }

  const getPaymentMethodLabel = (method) => {
    return salesManager.getPaymentMethodLabel(method)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-start gap-3">
        {/* Chip cu titlul */}
        <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm">
          <span className="font-semibold text-sm">Vânzări</span>
        </div>

        {/* Separator subtil */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* Date picker */}
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          placeholder="Selectează data"
          className="w-48"
        />

        {/* Buton adăugare vânzare */}
        <button 
          onClick={openSalesDrawer} 
          className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm transition-all"
          title="Vânzare nouă"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vânzări Totale</p>
                <p className="text-2xl font-bold">{currentStats.totalSales}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Venit</p>
                <p className="text-2xl font-bold">{currentStats.totalRevenue.toFixed(2)} RON</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Card</p>
                <p className="text-2xl font-bold">{currentStats.cardSales}</p>
                <p className="text-xs text-muted-foreground">{currentStats.cardRevenue.toFixed(2)} RON</p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cash</p>
                <p className="text-2xl font-bold">{currentStats.cashSales}</p>
                <p className="text-xs text-muted-foreground">{currentStats.cashRevenue.toFixed(2)} RON</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>


      {/* Sales List */}
      <div className="card">
        
        <div className="card-content">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Se încarcă vânzările...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nu există vânzări</h3>
              <p className="text-muted-foreground mb-4">
                Nu există vânzări pentru data selectată.
              </p>
              <button 
                onClick={openSalesDrawer}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Prima vânzare
              </button>
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Serviciu</th>
                    <th className="text-left p-3 font-medium">Suma</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="text-sm font-medium">{sale.date}</div>
                        <div className="text-xs text-muted-foreground">
                          {sale.time}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{sale.items[0]?.productName || 'N/A'}</div>
                        {sale.items.length > 1 && (
                          <div className="text-xs text-muted-foreground">
                            +{sale.items.length - 1} alte produse
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Casier: {sale.cashierName}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-lg">{parseFloat(sale.total).toFixed(2)} RON</div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          {getPaymentMethodIcon(sale.paymentMethod)}
                          <span className="ml-1">
                            {getPaymentMethodLabel(sale.paymentMethod)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BusinessSales
