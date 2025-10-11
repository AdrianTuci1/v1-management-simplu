import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, FileText, Check, Printer, Download } from 'lucide-react'
import { useInvoices } from '../../hooks/useInvoices'
import { useInvoiceDrawerStore } from '../../stores/invoiceDrawerStore'
import InvoiceClientCombobox from '../combobox/InvoiceClientCombobox'
import useSettingsStore from '../../stores/settingsStore'
import { generateInvoicePDF, OutputType } from '../../utils/invoicePdfGenerator'


const InvoiceDrawer = () => {
  const { isOpen, closeInvoiceDrawer, appointmentData, invoiceData } = useInvoiceDrawerStore()
  const { createInvoice, invoiceManager } = useInvoices()
  const taxSettings = useSettingsStore((state) => state.taxSettings)
  const locationDetails = useSettingsStore((state) => state.locationDetails)
  const printRef = useRef(null)
  
  // Debug: Log la montare pentru a vedea ce primim din store
  useEffect(() => {
    console.log('🔍 InvoiceDrawer - locationDetails din store:', locationDetails);
    console.log('🔍 InvoiceDrawer - taxSettings din store:', taxSettings);
  }, [locationDetails, taxSettings])
  
  const [formData, setFormData] = useState({
    client: null,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    notes: ''
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  const isViewMode = !!invoiceData // Mod vizualizare dacă avem invoiceData

  // Populează datele din programare sau factură existentă
  useEffect(() => {
    if (isOpen) {
      if (invoiceData) {
        // Mod vizualizare - populează cu datele facturii existente
        setFormData({
          client: {
            clientName: invoiceData.clientName,
            clientCUI: invoiceData.clientCUI,
            clientCNP: invoiceData.clientCNP,
            clientJ: invoiceData.clientJ,
            clientAddress: invoiceData.clientAddress,
            clientCity: invoiceData.clientCity,
            clientCounty: invoiceData.clientCounty,
            clientCountry: invoiceData.clientCountry,
            clientEmail: invoiceData.clientEmail,
            clientPhone: invoiceData.clientPhone,
            clientType: invoiceData.clientType
          },
          issueDate: invoiceData.issueDate,
          dueDate: invoiceData.dueDate,
          items: invoiceData.items || [],
          notes: invoiceData.notes || ''
        })
      } else if (appointmentData) {
        // Mod creare din programare
        const price = parseFloat(appointmentData.price) || 0
        const quantity = 1
        
        // Găsește cota TVA pentru servicii din settings
        const serviceVATRateObj = taxSettings.vatRates.find(r => r.id === taxSettings.serviceVATRateId);
        const vatRate = serviceVATRateObj ? serviceVATRateObj.rate / 100 : 0.19;
        
        setFormData(prev => ({
          ...prev,
          items: [{
            id: Date.now(),
            description: appointmentData.treatmentName || 'Serviciu medical',
            quantity: quantity,
            price: price,
            unit: 'buc',
            itemType: 'service',
            vatRate: vatRate,
            total: price * quantity,
            appointmentId: appointmentData.appointmentId || null // Salvăm ID-ul programării
          }]
        }))
      }
    }
  }, [isOpen, appointmentData, invoiceData, taxSettings])

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        client: null,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [],
        notes: ''
      })
    }
  }, [isOpen])

  // Calculează totalurile
  // Nota: prețurile introduse conțin deja TVA, fiecare item poate avea cotă diferită
  const totalWithVAT = invoiceManager.calculateSubtotal(formData.items) || 0 // Total cu TVA (suma prețurilor)
  const tax = invoiceManager.calculateTaxWithIndividualRates(formData.items) || 0 // TVA extras per item
  const totalWithoutVAT = totalWithVAT - tax || 0 // Total fără TVA
  const total = totalWithVAT // Total final (egal cu suma prețurilor cu TVA)

  // Procesează crearea facturii
  const processInvoice = async () => {
    if (formData.items.length === 0) return
    if (!formData.client) {
      alert('Vă rugăm să selectați un client pentru factură.')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Generează numărul de factură
      const invoiceNumber = invoiceManager.generateInvoiceNumber(formData.items.length + 1)
      
      const invoiceData = {
        // Date factură
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        items: formData.items,
        notes: formData.notes || '',
        // Date client (extrase din obiectul client)
        clientName: formData.client.clientName,
        clientCUI: formData.client.clientCUI || '',
        clientCNP: formData.client.clientCNP || '',
        clientJ: formData.client.clientJ || '',
        clientAddress: formData.client.clientAddress,
        clientCity: formData.client.clientCity || '',
        clientCounty: formData.client.clientCounty || '',
        clientCountry: formData.client.clientCountry || '',
        clientEmail: formData.client.clientEmail || '',
        clientPhone: formData.client.clientPhone || '',
        clientType: formData.client.clientType || 'persoana-fizica',
        // Meta date
        invoiceNumber,
        subtotal: totalWithoutVAT, // Salvează subtotal fără TVA
        tax,
        total, // Total cu TVA inclus
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      
      console.log('📋 Invoice data to send:', invoiceData);
      
      // Creează factura
      await createInvoice(invoiceData)
      
      // Reset după creare
      closeInvoiceDrawer()
      
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Eroare la crearea facturii: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Anulează crearea facturii
  const cancelInvoice = () => {
    closeInvoiceDrawer()
  }

  // Printează/salvează ca PDF
  const handlePrint = () => {
    window.print()
  }

  // Generează PDF profesional folosind template-ul jsPDFInvoiceTemplate
  const generatePDF = () => {
    try {
      console.log('📄 Location Details pentru PDF:', locationDetails);
      console.log('📋 Form Data pentru PDF:', formData);
      
      generateInvoicePDF(
        {
          invoiceNumber: invoiceData?.invoiceNumber || 'DRAFT',
          formData,
          totalWithoutVAT,
          tax,
          total
        },
        locationDetails,
        OutputType.DataUrlNewWindow
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Eroare la generarea PDF-ului: ' + error.message);
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 print:hidden" onClick={closeInvoiceDrawer} />
      
      {/* Modal centrat */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:relative print:p-0">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col print:max-w-full print:max-h-full print:shadow-none" ref={printRef}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b print:hidden">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isViewMode ? 'Vizualizare Factură' : 'Factură nouă'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {isViewMode ? `Factură ${invoiceData?.invoiceNumber || ''}` : 'Completează detaliile facturii'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isViewMode && (
                <>
                  <button 
                    onClick={generatePDF} 
                    className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                    title="Generează PDF"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={handlePrint} 
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                    title="Printează"
                  >
                    <Printer className="h-5 w-5" />
                  </button>
                </>
              )}
              <button 
                onClick={closeInvoiceDrawer} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 print:overflow-visible">
            {/* Header factură pentru print */}
            {isViewMode && (
              <div className="hidden print:block mb-8 pb-4 border-b-2 border-gray-300">
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">FACTURĂ</h1>
                  <p className="text-lg text-gray-600">Nr. {invoiceData?.invoiceNumber}</p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Furnizor</h3>
                    <p className="font-medium">{taxSettings?.companyInfo?.name || 'Compania Mea SRL'}</p>
                    <p className="text-sm text-gray-600">CUI: {taxSettings?.companyInfo?.cui || 'RO12345678'}</p>
                    <p className="text-sm text-gray-600">J: {taxSettings?.companyInfo?.registrationNumber || 'J40/1234/2020'}</p>
                    <p className="text-sm text-gray-600">{taxSettings?.companyInfo?.address || 'Str. Exemplu nr. 1'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Client</h3>
                    <p className="font-medium">{formData.client?.clientName}</p>
                    {formData.client?.clientCUI && <p className="text-sm text-gray-600">CUI: {formData.client.clientCUI}</p>}
                    {formData.client?.clientCNP && <p className="text-sm text-gray-600">CNP: {formData.client.clientCNP}</p>}
                    {formData.client?.clientAddress && <p className="text-sm text-gray-600">{formData.client.clientAddress}</p>}
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <div><span className="font-medium">Data emiterii:</span> {formData.issueDate}</div>
                  <div><span className="font-medium">Data scadenței:</span> {formData.dueDate}</div>
                </div>
              </div>
            )}

            {/* Client Selection - doar în modul de creare */}
            {!isViewMode && (
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Client *</label>
                <InvoiceClientCombobox 
                  value={formData.client}
                  onValueChange={(client) => setFormData(prev => ({ ...prev, client }))}
                  placeholder="Selectează sau caută client..."
                />
              </div>
            )}

            {/* Date factură - doar în modul de creare */}
            {!isViewMode && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Date factură</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">Data emiterii *</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">Data scadenței *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Date client - vizualizare în modul de afișare pentru ecran */}
            {isViewMode && (
              <div className="mb-6 print:hidden">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Informații Client</h4>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Nume:</span> {formData.client?.clientName}</div>
                    {formData.client?.clientCUI && <div><span className="font-medium">CUI:</span> {formData.client.clientCUI}</div>}
                    {formData.client?.clientCNP && <div><span className="font-medium">CNP:</span> {formData.client.clientCNP}</div>}
                    {formData.client?.clientAddress && <div><span className="font-medium">Adresă:</span> {formData.client.clientAddress}</div>}
                    {formData.client?.clientEmail && <div><span className="font-medium">Email:</span> {formData.client.clientEmail}</div>}
                    {formData.client?.clientPhone && <div><span className="font-medium">Telefon:</span> {formData.client.clientPhone}</div>}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <span className="font-medium text-gray-700">Data emiterii:</span>
                    <div className="text-gray-900 mt-1">{formData.issueDate}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <span className="font-medium text-gray-700">Data scadenței:</span>
                    <div className="text-gray-900 mt-1">{formData.dueDate}</div>
                  </div>
                </div>
              </div>
            )}



            {/* Lista item-uri */}
            {formData.items.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 print:text-base print:mb-4">
                  Items în factură ({formData.items.length})
                </h4>
                <div className="space-y-2 print:space-y-0">
                  {formData.items.map((item) => {
                    const itemTotalWithVAT = (item.price || 0) * (item.quantity || 0);
                    const itemVATRate = item.vatRate || 0.19;
                    const itemTotalWithoutVAT = itemTotalWithVAT / (1 + itemVATRate);
                    const itemVAT = itemTotalWithVAT - itemTotalWithoutVAT;
                    const vatRateName = item.itemType === 'service' ? 'Servicii' : 'Produse';
                    
                    return (
                      <div key={item.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm text-gray-900">{item.description}</div>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {item.itemType === 'service' ? 'Serviciu' : 'Produs'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {item.quantity || 0} {item.unit} × {(item.price || 0).toFixed(2)} RON
                            </div>
                            <div className="text-xs text-gray-600 mt-1 flex gap-3">
                              <span>Fără TVA: {itemTotalWithoutVAT.toFixed(2)} RON</span>
                              <span>TVA ({(itemVATRate * 100).toFixed(0)}%): {itemVAT.toFixed(2)} RON</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">{itemTotalWithVAT.toFixed(2)} RON</div>
                            <div className="text-xs text-gray-500 mt-0.5">cu TVA</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Totaluri */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:border-2 print:border-gray-400 print:mt-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm print:text-base">
                  <span className="text-gray-600">Total fără TVA:</span>
                  <span className="font-medium text-gray-900">{totalWithoutVAT.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between items-center text-sm print:text-base">
                  <span className="text-gray-600">TVA:</span>
                  <span className="font-medium text-gray-900">{tax.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300 print:pt-3 print:border-t-2">
                  <span className="font-semibold text-gray-900 print:text-lg">Total cu TVA:</span>
                  <span className="text-xl font-bold text-blue-600 print:text-2xl print:text-gray-900">{total.toFixed(2)} RON</span>
                </div>
              </div>
            </div>

            {/* Notițe */}
            {formData.notes && (
              <div className="mt-6 hidden print:block">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Notițe:</h4>
                <p className="text-sm text-gray-600">{formData.notes}</p>
              </div>
            )}
          </div>

          {/* Footer cu butoane - doar pentru modul de creare */}
          {!isViewMode && (
            <div className="border-t px-6 py-4 bg-gray-50 rounded-b-xl print:hidden">
            <div className="flex gap-3">
              <button 
                onClick={cancelInvoice}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Anulează
              </button>
              <button 
                onClick={processInvoice}
                disabled={formData.items.length === 0 || !formData.client || isProcessing}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-medium"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Se procesează...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Creează factură
                  </>
                )}
              </button>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Stiluri pentru print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .fixed {
            position: relative;
          }
          .print\\:relative {
            position: relative !important;
          }
        }
      `}</style>
    </>
  )
}

export default InvoiceDrawer
