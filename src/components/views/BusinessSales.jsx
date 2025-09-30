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
import { DatePicker } from '../ui/date-picker'

const BusinessSales = () => {
  const { openSalesDrawer } = useSalesDrawerStore()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Load sales data
  useEffect(() => {
    const loadSales = async () => {
      setLoading(true)
      try {
        // Simulate loading demo sales data
        const today = new Date().toISOString().split('T')[0]
        const demoSales = [
          {
            id: 'SALE00001',
            date: today,
            time: '09:30',
            items: [
              { productName: 'Consultație stomatologică', quantity: 1, price: 150.0, total: 150.0 }
            ],
            subtotal: 150.0,
            tax: 28.5,
            total: 178.5,
            paymentMethod: 'card',
            status: 'completed',
            cashierName: 'Dr. Maria Popescu'
          },
          {
            id: 'SALE00002',
            date: today,
            time: '11:15',
            items: [
              { productName: 'Detartraj', quantity: 1, price: 80.0, total: 80.0 }
            ],
            subtotal: 80.0,
            tax: 15.2,
            total: 95.2,
            paymentMethod: 'cash',
            status: 'completed',
            cashierName: 'Dr. Ion Ionescu'
          },
          {
            id: 'SALE00003',
            date: today,
            time: '14:30',
            items: [
              { productName: 'Tratament endodontic', quantity: 1, price: 450.0, total: 450.0 }
            ],
            subtotal: 450.0,
            tax: 85.5,
            total: 535.5,
            paymentMethod: 'card',
            status: 'completed',
            cashierName: 'Dr. Elena Dumitrescu'
          },
          {
            id: 'SALE00004',
            date: today,
            time: '16:45',
            items: [
              { productName: 'Consultație de control', quantity: 1, price: 50.0, total: 50.0 }
            ],
            subtotal: 50.0,
            tax: 9.5,
            total: 59.5,
            paymentMethod: 'card',
            status: 'pending',
            cashierName: 'Dr. Alexandru Pop'
          }
        ]
        
        setSales(demoSales)
      } catch (error) {
        console.error('Error loading sales:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSales()
  }, [])

  // Filter sales by selected date
  const filteredSales = sales.filter(sale => sale.date === selectedDate)

  // Calculate statistics for selected date
  const stats = {
    totalSales: filteredSales.length,
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    completedSales: filteredSales.filter(s => s.status === 'completed').length,
    pendingSales: filteredSales.filter(s => s.status === 'pending').length
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', text: 'Completată' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'În așteptare' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Anulată' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vânzări</h1>
          <p className="text-muted-foreground">Gestionează vânzările și tranzacțiile</p>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="Selectează data"
            className="w-48"
          />
          <button 
            onClick={openSalesDrawer} 
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Vânzare nouă
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Vânzări</p>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Venit Total</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} RON</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completate</p>
                <p className="text-2xl font-bold">{stats.completedSales}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">În Așteptare</p>
                <p className="text-2xl font-bold">{stats.pendingSales}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
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
            <div className="overflow-x-auto">
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
                        <div className="font-medium text-lg">{sale.total.toFixed(2)} RON</div>
                        <div className="text-xs text-muted-foreground">
                          {getPaymentMethodIcon(sale.paymentMethod)}
                          <span className="ml-1">
                            {sale.paymentMethod === 'card' ? 'Card' : 'Numerar'}
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
