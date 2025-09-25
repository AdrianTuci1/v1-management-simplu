import { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Plus, 
  DollarSign, 
  Receipt, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { DatePicker } from '../ui/date-picker'

const FinancialBilling = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Load invoices data
  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true)
      try {
        // Simulate loading demo invoices data
        const today = new Date().toISOString().split('T')[0]
        const demoInvoices = [
          {
            id: 'INV-2024-001',
            invoiceNumber: 'F001/2024',
            date: today,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            patientName: 'Maria Popescu',
            patientEmail: 'maria.popescu@email.com',
            items: [
              { description: 'Consultație stomatologică', quantity: 1, price: 150, total: 150 }
            ],
            subtotal: 150,
            tax: 28.5,
            total: 178.5,
            status: 'paid',
            paymentMethod: 'card',
            createdAt: `${today}T10:30:00Z`
          },
          {
            id: 'INV-2024-002',
            invoiceNumber: 'F002/2024',
            date: today,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            patientName: 'Ion Ionescu',
            patientEmail: 'ion.ionescu@email.com',
            items: [
              { description: 'Detartraj', quantity: 1, price: 80, total: 80 }
            ],
            subtotal: 80,
            tax: 15.2,
            total: 95.2,
            status: 'pending',
            paymentMethod: null,
            createdAt: `${today}T14:20:00Z`
          },
          {
            id: 'INV-2024-003',
            invoiceNumber: 'F003/2024',
            date: today,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            patientName: 'Elena Dumitrescu',
            patientEmail: 'elena.dumitrescu@email.com',
            items: [
              { description: 'Extracție dinte', quantity: 1, price: 350, total: 350 },
              { description: 'Anestezie locală', quantity: 1, price: 50, total: 50 }
            ],
            subtotal: 400,
            tax: 76,
            total: 476,
            status: 'overdue',
            paymentMethod: null,
            createdAt: '2024-01-13T09:15:00Z'
          }
        ]
        
        setInvoices(demoInvoices)
      } catch (error) {
        console.error('Error loading invoices:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInvoices()
  }, [])

  // Filter invoices by selected date
  const filteredInvoices = invoices.filter(invoice => invoice.date === selectedDate)

  // Calculate statistics for selected date
  const stats = {
    totalInvoices: filteredInvoices.length,
    totalAmount: filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    paidInvoices: filteredInvoices.filter(i => i.status === 'paid').length,
    pendingInvoices: filteredInvoices.filter(i => i.status === 'pending').length,
    overdueInvoices: filteredInvoices.filter(i => i.status === 'overdue').length,
    paidAmount: filteredInvoices.filter(i => i.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
    pendingAmount: filteredInvoices.filter(i => i.status === 'pending').reduce((sum, invoice) => sum + invoice.total, 0)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', text: 'Plătită', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'În așteptare', icon: Clock },
      overdue: { color: 'bg-red-100 text-red-800', text: 'Restantă', icon: AlertCircle }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturare</h1>
          <p className="text-muted-foreground">Gestionează facturile și plățile</p>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="Selectează data"
            className="w-48"
          />
          <button className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Factură nouă
          </button>
        </div>
      </div>



      {/* Invoices List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="card-title">Lista Facturi</h3>
          </div>
        </div>
        
        <div className="card-content">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Se încarcă facturile...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nu există facturi</h3>
              <p className="text-muted-foreground mb-4">
                Nu există facturi pentru data selectată.
              </p>
              <button className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Prima factură
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Factură</th>
                    <th className="text-left p-3 font-medium">Pacient</th>
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Suma</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span className="font-medium">{invoice.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{invoice.patientName}</div>
                          <div className="text-sm text-muted-foreground">{invoice.patientEmail}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {invoice.date}
                          {isOverdue(invoice.dueDate) && invoice.status !== 'paid' && (
                            <div className="text-xs text-red-600">
                              Scadentă: {invoice.dueDate}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{invoice.total.toFixed(2)} RON</div>
                        <div className="text-xs text-muted-foreground">
                          Subtotal: {invoice.subtotal.toFixed(2)} RON
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

export default FinancialBilling