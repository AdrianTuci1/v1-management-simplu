import { useState, useEffect } from 'react'
import { X, Plus, Trash2, FileText, Check, User } from 'lucide-react'
import { useInvoices } from '../../hooks/useInvoices'
import { useInvoiceClients } from '../../hooks/useInvoiceClients'
import { useInvoiceDrawerStore } from '../../stores/invoiceDrawerStore'


const InvoiceDrawer = () => {
  const { isOpen, closeInvoiceDrawer, appointmentData } = useInvoiceDrawerStore()
  const { createInvoice, invoiceManager } = useInvoices()
  const { createClient, checkDuplicateClient, invoiceClientManager } = useInvoiceClients()
  
  
  const [formData, setFormData] = useState({
    client: null,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    notes: '',
    taxRate: 0.19
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentItem, setCurrentItem] = useState({
    description: '',
    quantity: 1,
    price: 0,
    unit: 'buc'
  })
  const [showClientDetailsMenu, setShowClientDetailsMenu] = useState(false)
  const [newClientData, setNewClientData] = useState({
    clientName: '',
    clientType: 'persoana-fizica',
    clientCUI: '',
    clientCNP: '',
    clientJ: '',
    clientAddress: '',
    clientCity: '',
    clientCounty: '',
    clientCountry: '',
    clientEmail: '',
    clientPhone: ''
  })

  // Populează datele din programare dacă există
  useEffect(() => {
    if (isOpen && appointmentData) {
      const price = parseFloat(appointmentData.price) || 0
      const quantity = 1
      setFormData(prev => ({
        ...prev,
        items: [{
          id: Date.now(),
          description: appointmentData.treatmentName || 'Serviciu medical',
          quantity: quantity,
          price: price,
          unit: 'buc',
          total: price * quantity
        }]
      }))
    }
  }, [isOpen, appointmentData])

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        client: null,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [],
        notes: '',
        taxRate: 0.19
      })
      setCurrentItem({
        description: '',
        quantity: 1,
        price: 0,
        unit: 'buc'
      })
    }
  }, [isOpen])

  // Calculează totalurile
  const subtotal = invoiceManager.calculateSubtotal(formData.items) || 0
  const tax = invoiceManager.calculateTax(formData.items, formData.taxRate) || 0
  const total = invoiceManager.calculateTotal(formData.items, formData.taxRate) || 0

  // Adaugă item în factură
  const addItem = () => {
    if (!currentItem.description || currentItem.price <= 0) return
    
    const newItem = {
      id: Date.now(),
      ...currentItem,
      total: currentItem.price * currentItem.quantity
    }
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
    
    setCurrentItem({
      description: '',
      quantity: 1,
      price: 0,
      unit: 'buc'
    })
  }

  // Actualizează item-ul
  const updateItem = (itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              [field]: value,
              total: field === 'price' || field === 'quantity' 
                ? (field === 'price' ? value : item.price) * (field === 'quantity' ? value : item.quantity)
                : item.total
            }
          : item
      )
    }))
  }

  // Șterge item-ul
  const removeItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

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
        ...formData,
        // Extrage datele clientului
        clientName: formData.client.clientName,
        clientCUI: formData.client.clientCUI,
        clientCNP: formData.client.clientCNP,
        clientAddress: formData.client.clientAddress,
        clientEmail: formData.client.clientEmail,
        clientPhone: formData.client.clientPhone,
        invoiceNumber,
        subtotal,
        tax,
        total,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      
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

  // Gestionează crearea unui client nou
  const handleCreateClient = async () => {
    try {
      // Verifică dacă există duplicat
      if (newClientData.clientCUI || newClientData.clientCNP) {
        const isDuplicate = await checkDuplicateClient(
          newClientData.clientCUI, 
          newClientData.clientCNP
        )
        if (isDuplicate) {
          alert('Există deja un client cu acest CUI sau CNP.')
          return
        }
      }

      // Validează datele
      const validationResult = invoiceClientManager.validateClient(newClientData)
      if (!validationResult.isValid) {
        alert(validationResult.errors.join('\n'))
        return
      }
      
      // Creează clientul
      const newClient = await createClient(newClientData)
      
      // Selectează clientul nou creat
      setFormData(prev => ({ ...prev, client: newClient }))
      
      // Reset form și închide meniul
      setNewClientData({
        clientName: '',
        clientType: 'persoana-fizica',
        clientCUI: '',
        clientCNP: '',
        clientJ: '',
        clientAddress: '',
        clientCity: '',
        clientCounty: '',
        clientCountry: '',
        clientEmail: '',
        clientPhone: ''
      })
      setShowClientDetailsMenu(false)
      
    } catch (error) {
      console.error('Error creating client:', error)
      alert('Eroare la crearea clientului: ' + error.message)
    }
  }

  // Gestionează schimbarea input-ului pentru client nou
  const handleNewClientInputChange = (field, value) => {
    setNewClientData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={closeInvoiceDrawer} />
      
      {/* Modal centrat */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Factură nouă</h2>
              <p className="text-sm text-gray-500 mt-0.5">Completează detaliile facturii</p>
            </div>
            <button 
              onClick={closeInvoiceDrawer} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Client Selection */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Client *</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.client?.clientName || ''}
                    placeholder="Selectează client..."
                    readOnly
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setShowClientDetailsMenu(true)}
                  />
                </div>
                <button
                  onClick={() => setShowClientDetailsMenu(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Client nou
                </button>
              </div>
            </div>

            {/* Date factură */}
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

            {/* Adaugă item nou */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Servicii / Produse</h4>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block">Descriere *</label>
                  <input
                    type="text"
                    value={currentItem.description}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: Consultație, Tratament..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">Cantitate</label>
                    <input
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600 mb-1.5 block">Preț (RON)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.price}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">UM</label>
                    <select
                      value={currentItem.unit}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="buc">buc</option>
                      <option value="kg">kg</option>
                      <option value="l">l</option>
                      <option value="m">m</option>
                      <option value="ore">ore</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={addItem}
                  disabled={!currentItem.description || currentItem.price <= 0}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Adaugă în factură
                </button>
              </div>
            </div>

            {/* Lista item-uri */}
            {formData.items.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Items în factură ({formData.items.length})</h4>
                <div className="space-y-2">
                  {formData.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{item.description}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {item.quantity || 0} {item.unit} × {(item.price || 0).toFixed(2)} RON
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">{(item.total || 0).toFixed(2)} RON</span>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totaluri */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">{subtotal.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">TVA (19%):</span>
                  <span className="font-medium text-gray-900">{tax.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-blue-600">{total.toFixed(2)} RON</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer cu butoane */}
          <div className="border-t px-6 py-4 bg-gray-50 rounded-b-xl">
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
        </div>
      </div>

      {/* Client Details Modal */}
      {showClientDetailsMenu && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Client nou</h2>
                <p className="text-sm text-gray-500 mt-0.5">Completează datele clientului</p>
              </div>
              <button 
                onClick={() => setShowClientDetailsMenu(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {/* Nume client și tip persoană */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">Nume client *</label>
                    <input
                      type="text"
                      value={newClientData.clientName}
                      onChange={(e) => handleNewClientInputChange('clientName', e.target.value)}
                      placeholder="Numele complet al clientului"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">Tip persoană</label>
                    <select
                      value={newClientData.clientType}
                      onChange={(e) => handleNewClientInputChange('clientType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="persoana-fizica">Persoană fizică</option>
                      <option value="persoana-juridica">Persoană juridică</option>
                      <option value="srl">SRL</option>
                    </select>
                  </div>
                </div>

                {/* CUI/CNP și J */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">
                      {newClientData.clientType === 'persoana-fizica' ? 'CNP' : 'CUI'}
                    </label>
                    <input
                      type="text"
                      value={newClientData.clientType === 'persoana-fizica' ? newClientData.clientCNP : newClientData.clientCUI}
                      onChange={(e) => {
                        if (newClientData.clientType === 'persoana-fizica') {
                          handleNewClientInputChange('clientCNP', e.target.value)
                        } else {
                          handleNewClientInputChange('clientCUI', e.target.value.toUpperCase())
                        }
                      }}
                      placeholder={newClientData.clientType === 'persoana-fizica' ? '1234567890123' : 'RO12345678'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">Nr. Reg. Com. (J)</label>
                    <input
                      type="text"
                      value={newClientData.clientJ}
                      onChange={(e) => handleNewClientInputChange('clientJ', e.target.value)}
                      placeholder="J40/123/2023"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Adresă */}
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block">Adresă *</label>
                  <textarea
                    value={newClientData.clientAddress}
                    onChange={(e) => handleNewClientInputChange('clientAddress', e.target.value)}
                    placeholder="Adresa completă a clientului"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Oraș, Județ, Țară */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">Oraș</label>
                    <input
                      type="text"
                      value={newClientData.clientCity}
                      onChange={(e) => handleNewClientInputChange('clientCity', e.target.value)}
                      placeholder="București"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">Județ</label>
                    <input
                      type="text"
                      value={newClientData.clientCounty}
                      onChange={(e) => handleNewClientInputChange('clientCounty', e.target.value)}
                      placeholder="București"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">Țară</label>
                    <input
                      type="text"
                      value={newClientData.clientCountry}
                      onChange={(e) => handleNewClientInputChange('clientCountry', e.target.value)}
                      placeholder="România"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Email și telefon */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={newClientData.clientEmail}
                      onChange={(e) => handleNewClientInputChange('clientEmail', e.target.value)}
                      placeholder="client@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">Telefon</label>
                    <input
                      type="tel"
                      value={newClientData.clientPhone}
                      onChange={(e) => handleNewClientInputChange('clientPhone', e.target.value)}
                      placeholder="+40 123 456 789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer cu butoane */}
            <div className="border-t px-6 py-4 bg-gray-50 rounded-b-xl">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClientDetailsMenu(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  Anulează
                </button>
                <button
                  onClick={handleCreateClient}
                  disabled={!newClientData.clientName || !newClientData.clientAddress}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-medium"
                >
                  <Check className="h-4 w-4" />
                  Creează client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default InvoiceDrawer
