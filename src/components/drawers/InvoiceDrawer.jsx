import { useState, useEffect } from 'react'
import { X, Plus, Minus, Trash2, CreditCard, Receipt, FileText, Check, XCircle, Send, Search, User, Building } from 'lucide-react'
import { useInvoices } from '../../hooks/useInvoices'
import { useInvoiceClients } from '../../hooks/useInvoiceClients'
import { useInvoiceDrawerStore } from '../../stores/invoiceDrawerStore'
import { usePatients } from '../../hooks/usePatients'
import { useTreatments } from '../../hooks/useTreatments'
import { useDrawer } from '../../contexts/DrawerContext.jsx'


const InvoiceDrawer = () => {
  const { isOpen, closeInvoiceDrawer, appointmentData } = useInvoiceDrawerStore()
  const { patients } = usePatients()
  const { treatments } = useTreatments()
  const { createInvoice, invoiceManager } = useInvoices()
  const { createClient, checkDuplicateClient, invoiceClientManager } = useInvoiceClients()
  const { openDrawer } = useDrawer()
  
  
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
  const [clientSearchTerm, setClientSearchTerm] = useState('')
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
      setFormData(prev => ({
        ...prev,
        items: [{
          id: Date.now(),
          description: appointmentData.treatmentName || 'Serviciu medical',
          quantity: 1,
          price: parseFloat(appointmentData.price) || 0,
          unit: 'buc'
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
  const subtotal = invoiceManager.calculateSubtotal(formData.items)
  const tax = invoiceManager.calculateTax(formData.items, formData.taxRate)
  const total = invoiceManager.calculateTotal(formData.items, formData.taxRate)

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
      
      {/* Full Screen Drawer */}
      <div 
        className="fixed inset-0 z-50 bg-white w-full h-full max-w-none"
        style={{ 
          width: '100vw', 
          height: '100vh',
          maxWidth: 'none',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 h-16">
          <h2 className="text-2xl font-bold">Factură nouă</h2>
          <button onClick={closeInvoiceDrawer} className="p-2 hover:bg-gray-200 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content - Single Column */}
        <div className="flex h-[calc(100vh-64px)]">
          {/* Produse/servicii și totaluri */}
          <div className="w-full flex flex-col">
            {/* Header cu date factură și butoane */}
            <div className="p-4 border-b bg-white">
              {/* Căutare client și buton Adaugă */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.client?.clientName || ''}
                      placeholder="Caută client..."
                      readOnly
                      className="w-full pl-10 pr-3 py-2 border border-input rounded-md text-sm bg-gray-50 cursor-pointer"
                      onClick={() => setShowClientDetailsMenu(true)}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowClientDetailsMenu(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Adaugă
                </button>
              </div>

              {/* Date factură */}
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-700 mb-3">Date Factură</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data emiterii *</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data scadenței *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Produse/Servicii</h3>
              </div>
              
              {/* Căutare produse/servicii */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  placeholder="Caută produse sau servicii..."
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              
              {/* Adaugă item nou */}
              <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium text-gray-700">Adaugă item nou</h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descriere *</label>
                    <input
                      type="text"
                      value={currentItem.description}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrierea produsului/serviciului"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cantitate</label>
                      <input
                        type="number"
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Preț</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentItem.price}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Unitate</label>
                      <select
                        value={currentItem.unit}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="buc">buc</option>
                        <option value="kg">kg</option>
                        <option value="l">l</option>
                        <option value="m">m</option>
                        <option value="m²">m²</option>
                        <option value="m³">m³</option>
                        <option value="ore">ore</option>
                      </select>
                    </div>
                  </div>
                  
                  <button
                    onClick={addItem}
                    disabled={!currentItem.description || currentItem.price <= 0}
                    className="w-full p-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    Adaugă item
                  </button>
                </div>
              </div>

              {/* Lista item-uri */}
              {formData.items.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-md font-medium text-gray-700">Items în factură</h4>
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.description}</div>
                        <div className="text-sm text-gray-600">
                          {item.quantity} {item.unit} × {item.price.toFixed(2)} RON = {item.total.toFixed(2)} RON
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totaluri și acțiuni */}
            <div className="border-t p-4 bg-white shadow-lg">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm font-medium">{subtotal.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">TVA (19%):</span>
                  <span className="text-sm font-medium">{tax.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-lg font-semibold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-green-600">{total.toFixed(2)} RON</span>
                </div>
              </div>

              {/* Butoane acțiuni */}
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={processInvoice}
                  disabled={formData.items.length === 0 || !formData.client || isProcessing}
                  className="p-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Procesare...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Salvează
                    </>
                  )}
                </button>
                <button 
                  onClick={cancelInvoice}
                  disabled={isProcessing}
                  className="p-3 bg-red-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Anulează
                </button>
                <button 
                  onClick={() => {
                    // TODO: Implement PDF generation
                    alert('Funcționalitatea de printare PDF va fi implementată')
                  }}
                  disabled={formData.items.length === 0 || !formData.client || isProcessing}
                  className="p-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  Printează
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Client Details Menu Overlay - Full Screen */}
      {showClientDetailsMenu && (
        <div className="fixed inset-0 bg-black/50 z-[70]">
          <div 
            className="bg-white w-full h-full max-w-none"
            style={{ 
              width: '100vw', 
              height: '100vh',
              maxWidth: 'none',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 h-16">
              <h2 className="text-2xl font-bold">Client Nou</h2>
              <button onClick={() => setShowClientDetailsMenu(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex h-[calc(100vh-64px)]">
              <div className="w-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 bg-white">
                  <div className="space-y-6">
                    {/* Nume client și tip persoană */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nume client *</label>
                        <input
                          type="text"
                          value={newClientData.clientName}
                          onChange={(e) => handleNewClientInputChange('clientName', e.target.value)}
                          placeholder="Numele complet al clientului"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tip persoană</label>
                        <select
                          value={newClientData.clientType}
                          onChange={(e) => handleNewClientInputChange('clientType', e.target.value)}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="persoana-fizica">Persoană fizică</option>
                          <option value="persoana-juridica">Persoană juridică</option>
                          <option value="srl">SRL</option>
                        </select>
                      </div>
                    </div>

                    {/* CUI/CNP unificat și J */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
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
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">J</label>
                        <input
                          type="text"
                          value={newClientData.clientJ}
                          onChange={(e) => handleNewClientInputChange('clientJ', e.target.value)}
                          placeholder="J40/123/2023"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                    </div>

                    {/* Adresă */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Adresă *</label>
                      <textarea
                        value={newClientData.clientAddress}
                        onChange={(e) => handleNewClientInputChange('clientAddress', e.target.value)}
                        placeholder="Adresa completă a clientului"
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    {/* Oraș, Județ, Țară */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Oraș</label>
                        <input
                          type="text"
                          value={newClientData.clientCity}
                          onChange={(e) => handleNewClientInputChange('clientCity', e.target.value)}
                          placeholder="București"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Județ</label>
                        <input
                          type="text"
                          value={newClientData.clientCounty}
                          onChange={(e) => handleNewClientInputChange('clientCounty', e.target.value)}
                          placeholder="București"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Țară</label>
                        <input
                          type="text"
                          value={newClientData.clientCountry}
                          onChange={(e) => handleNewClientInputChange('clientCountry', e.target.value)}
                          placeholder="România"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                    </div>

                    {/* Email și telefon */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input
                          type="email"
                          value={newClientData.clientEmail}
                          onChange={(e) => handleNewClientInputChange('clientEmail', e.target.value)}
                          placeholder="client@email.com"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Telefon</label>
                        <input
                          type="tel"
                          value={newClientData.clientPhone}
                          onChange={(e) => handleNewClientInputChange('clientPhone', e.target.value)}
                          placeholder="+40 123 456 789"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer cu butoane */}
                <div className="border-t p-4 bg-white shadow-lg">
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateClient}
                      disabled={!newClientData.clientName || !newClientData.clientAddress}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Creează client
                    </button>
                    <button
                      onClick={() => setShowClientDetailsMenu(false)}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Anulează
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default InvoiceDrawer
