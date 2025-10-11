import { useState, useEffect } from 'react'
import { 
  Plus, 
  Receipt, 
  Loader2,
  FileText
} from 'lucide-react'
import { DatePicker } from '../ui/date-picker'
import { useInvoices } from '../../hooks/useInvoices'
import { useInvoiceDrawerStore } from '../../stores/invoiceDrawerStore'

const FinancialBilling = () => {
  const { 
    invoices, 
    loading, 
    loadInvoicesByDate
  } = useInvoices()
  const { openInvoiceDrawer, openInvoiceDrawerWithInvoice } = useInvoiceDrawerStore()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Load invoices data
  useEffect(() => {
    loadInvoicesByDate(selectedDate)
  }, [selectedDate, loadInvoicesByDate])

  // Filter invoices by selected date
  const filteredInvoices = invoices.filter(invoice => invoice.issueDate === selectedDate)

  // Handle creating new invoice
  const handleCreateInvoice = () => {
    openInvoiceDrawer()
  }

  // Handle opening existing invoice
  const handleOpenInvoice = (invoice) => {
    openInvoiceDrawerWithInvoice(invoice)
  }

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-start gap-3">
        {/* Chip cu titlul */}
        <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm">
          <span className="font-semibold text-sm">Facturare</span>
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

        {/* Buton adăugare factură */}
        <button 
          onClick={handleCreateInvoice}
          className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-sm transition-all"
          title="Factură nouă"
        >
          <Plus className="h-4 w-4" />
        </button>
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
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Factură</th>
                    <th className="text-left p-3 font-medium">Client</th>
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Suma</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr 
                      key={invoice.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleOpenInvoice(invoice)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{invoice.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{invoice.clientName}</div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.clientCUI && `CUI: ${invoice.clientCUI}`}
                            {invoice.clientCNP && `CNP: ${invoice.clientCNP}`}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div>Emisă: {invoice.formattedIssueDate || invoice.issueDate}</div>
                          <div>Scadentă: {invoice.formattedDueDate || invoice.dueDate}</div>
                          {isOverdue(invoice.dueDate) && invoice.status !== 'paid' && (
                            <div className="text-xs text-red-600">
                              RESTANTĂ
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{(invoice.total || 0).toFixed(2)} RON</div>
                        <div className="text-xs text-muted-foreground">
                          Subtotal: {(invoice.subtotal || 0).toFixed(2)} RON
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