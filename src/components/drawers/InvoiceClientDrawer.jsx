import { useState, useEffect } from 'react'
import { X, Plus, Save, Trash2, User, Building, Check, XCircle } from 'lucide-react'
import { useInvoiceClients } from '../../hooks/useInvoiceClients'
import { useDrawer } from '../../contexts/DrawerContext.jsx'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerNavigation, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'

const InvoiceClientDrawer = () => {
  const { drawerOpen, drawerContent, closeDrawer } = useDrawer()
  
  // Verifică dacă drawer-ul este deschis pentru invoice-client
  const isOpen = drawerOpen && drawerContent?.type === 'new-invoice-client'
  const isNewClient = true
  const clientData = null
  const [currentMenu, setCurrentMenu] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const { createClient, updateClient, deleteClient, checkDuplicateClient, invoiceClientManager } = useInvoiceClients()
  
  const [formData, setFormData] = useState(() => {
    if (clientData) {
      return {
        clientName: clientData.clientName || '',
        clientCUI: clientData.clientCUI || '',
        clientCNP: clientData.clientCNP || '',
        clientAddress: clientData.clientAddress || '',
        clientEmail: clientData.clientEmail || '',
        clientPhone: clientData.clientPhone || ''
      }
    }
    return {
      clientName: '',
      clientCUI: '',
      clientCNP: '',
      clientAddress: '',
      clientEmail: '',
      clientPhone: ''
    }
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Verifică dacă există duplicat
      if (formData.clientCUI || formData.clientCNP) {
        const isDuplicate = await checkDuplicateClient(formData.clientCUI, formData.clientCNP)
        if (isDuplicate) {
          setError('Există deja un client cu acest CUI sau CNP.')
          return
        }
      }

      // Validează datele
      const validationResult = invoiceClientManager.validateClient(formData)
      if (!validationResult.isValid) {
        setError(validationResult.errors.join('\n'))
        return
      }

      if (isNewClient) {
      await createClient(formData)
    } else {
      await updateClient(clientData.id, formData)
    }
    
    closeDrawer()
    } catch (err) {
      setError(err.message)
      console.error('Error saving client:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!clientData?.id) return
    
    if (!confirm('Sigur doriți să ștergeți acest client?')) return
    
    setLoading(true)
    setError(null)
    
    try {
      await deleteClient(clientData.id)
      closeDrawer()
    } catch (err) {
      setError(err.message)
      console.error('Error deleting client:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderMenu1 = () => (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        Informații de bază
      </div>
      
      {/* Nume client */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Nume client *</label>
        <input
          type="text"
          value={formData.clientName}
          onChange={(e) => handleInputChange('clientName', e.target.value)}
          placeholder="Numele complet al clientului"
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* CUI/CNP */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">CUI</label>
          <input
            type="text"
            value={formData.clientCUI}
            onChange={(e) => handleInputChange('clientCUI', e.target.value.toUpperCase())}
            placeholder="RO12345678"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">CNP</label>
          <input
            type="text"
            value={formData.clientCNP}
            onChange={(e) => handleInputChange('clientCNP', e.target.value)}
            placeholder="1234567890123"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Adresă */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Adresă *</label>
        <textarea
          value={formData.clientAddress}
          onChange={(e) => handleInputChange('clientAddress', e.target.value)}
          placeholder="Adresa completă a clientului"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Email și telefon */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={formData.clientEmail}
            onChange={(e) => handleInputChange('clientEmail', e.target.value)}
            placeholder="client@email.com"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Telefon</label>
          <input
            type="tel"
            value={formData.clientPhone}
            onChange={(e) => handleInputChange('clientPhone', e.target.value)}
            placeholder="+40 123 456 789"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (currentMenu) {
      case 1:
        return renderMenu1()
      default:
        return renderMenu1()
    }
  }

  const navigationItems = [
    { id: 1, label: 'Detalii', icon: User }
  ]

  if (!isOpen) return null

  return (
    <Drawer onClose={closeDrawer} position="overlay">
      <DrawerHeader
        title="Client Factură"
        subtitle={isNewClient ? 'Client nou' : 'Editează clientul'}
        onClose={closeDrawer}
      />
      
      <DrawerContent>
        {renderContent()}
      </DrawerContent>
      
      <DrawerFooter>
        <div className="flex gap-2">
          {!isNewClient && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="btn btn-destructive"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Șterge
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={closeDrawer}
            className="btn btn-outline"
            disabled={loading}
          >
            Anulează
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isNewClient ? 'Creează clientul' : 'Salvează modificările'}
          </button>
        </div>
      </DrawerFooter>
    </Drawer>
  )
}

export default InvoiceClientDrawer
