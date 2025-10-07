import { useState, useEffect, useRef } from 'react'
import { Search, Plus, User, Building, Check, X } from 'lucide-react'
import { useInvoiceClients } from '../../hooks/useInvoiceClients'
import { useDrawer } from '../../contexts/DrawerContext.jsx'

const InvoiceClientCombobox = ({ 
  value, 
  onValueChange, 
  placeholder = "Caută sau adaugă client nou",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newClientData, setNewClientData] = useState({
    clientName: '',
    clientCUI: '',
    clientCNP: '',
    clientAddress: '',
    clientEmail: '',
    clientPhone: ''
  })
  
  const { 
    clients, 
    loading, 
    searchClients, 
    createClient, 
    checkDuplicateClient,
    invoiceClientManager 
  } = useInvoiceClients()
  const { openDrawer } = useDrawer()
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Efectuează căutarea când se schimbă termenul
  useEffect(() => {
    if (searchTerm.trim() === '') {
      return
    }
    
    const timeoutId = setTimeout(() => {
      searchClients(searchTerm)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchClients])

  // Setează clientul selectat când se schimbă valoarea
  useEffect(() => {
    if (value && typeof value === 'object') {
      setSelectedClient(value)
    } else if (value && typeof value === 'string') {
      // Caută clientul după ID
      const client = clients.find(c => c.id === value || c.resourceId === value)
      if (client) {
        setSelectedClient(client)
      }
    } else {
      setSelectedClient(null)
    }
  }, [value, clients])

  // Gestionează click-ul în afara dropdown-ului
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setShowCreateForm(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Gestionează selectarea unui client
  const handleClientSelect = (client) => {
    setSelectedClient(client)
    onValueChange(client)
    setIsOpen(false)
    setSearchTerm('')
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
      handleClientSelect(newClient)
      
      // Reset form
      setNewClientData({
        clientName: '',
        clientCUI: '',
        clientCNP: '',
        clientAddress: '',
        clientEmail: '',
        clientPhone: ''
      })
      setShowCreateForm(false)
      
    } catch (error) {
      console.error('Error creating client:', error)
      alert('Eroare la crearea clientului: ' + error.message)
    }
  }

  // Gestionează deschiderea drawer-ului pentru client nou
  const handleOpenNewClientDrawer = () => {
    openDrawer({ type: 'new-invoice-client' })
    setIsOpen(false)
  }

  // Gestionează ștergerea selecției
  const handleClearSelection = () => {
    setSelectedClient(null)
    onValueChange(null)
  }

  // Gestionează schimbarea input-ului pentru client nou
  const handleNewClientInputChange = (field, value) => {
    setNewClientData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input principal */}
      <div 
        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:border-primary ${
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-input'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedClient ? (
          <div className="flex items-center gap-2 flex-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">{selectedClient.clientName}</div>
              <div className="text-sm text-muted-foreground">
                {selectedClient.clientCUI && `CUI: ${selectedClient.clientCUI}`}
                {selectedClient.clientCNP && `CNP: ${selectedClient.clientCNP.substring(0, 6)}***`}
              </div>
            </div>
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearSelection()
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{placeholder}</span>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-input rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Search input */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Caută după nume, CUI, CNP..."
                className="w-full pl-10 pr-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Se caută...
              </div>
            ) : clients.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? 'Nu s-au găsit clienți' : 'Nu există clienți'}
              </div>
            ) : (
              clients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {client.clientCUI ? (
                        <Building className="h-4 w-4 text-blue-600" />
                      ) : (
                        <User className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{client.clientName}</div>
                      <div className="text-sm text-muted-foreground">
                        {client.clientCUI && `CUI: ${client.clientCUI}`}
                        {client.clientCNP && `CNP: ${client.clientCNP.substring(0, 6)}***`}
                        {client.clientAddress && ` • ${client.clientAddress.substring(0, 30)}...`}
                      </div>
                    </div>
                    {selectedClient?.id === client.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="p-3 border-t bg-gray-50">
            {!showCreateForm ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex-1 flex items-center justify-center gap-2 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Client nou
                </button>
                <button
                  onClick={handleOpenNewClientDrawer}
                  className="flex-1 flex items-center justify-center gap-2 p-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
                >
                  <User className="h-4 w-4" />
                  Formular complet
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm font-medium">Adaugă client nou</div>
                
                {/* Nume client */}
                <div>
                  <input
                    type="text"
                    value={newClientData.clientName}
                    onChange={(e) => handleNewClientInputChange('clientName', e.target.value)}
                    placeholder="Nume client *"
                    className="w-full p-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* CUI/CNP */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newClientData.clientCUI}
                    onChange={(e) => handleNewClientInputChange('clientCUI', e.target.value.toUpperCase())}
                    placeholder="CUI (RO12345678)"
                    className="p-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="text"
                    value={newClientData.clientCNP}
                    onChange={(e) => handleNewClientInputChange('clientCNP', e.target.value)}
                    placeholder="CNP (13 cifre)"
                    className="p-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Adresă */}
                <div>
                  <input
                    type="text"
                    value={newClientData.clientAddress}
                    onChange={(e) => handleNewClientInputChange('clientAddress', e.target.value)}
                    placeholder="Adresă *"
                    className="w-full p-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Butoane acțiuni */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateClient}
                    disabled={!newClientData.clientName || !newClientData.clientAddress}
                    className="flex-1 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm"
                  >
                    Creează
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
                  >
                    Anulează
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoiceClientCombobox
