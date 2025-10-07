import { useState, useEffect } from 'react'
import { Receipt, Printer, Save } from 'lucide-react'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import { useSettings } from '../../hooks/useSettings'

const CashRegisterDrawer = ({ onClose, settingId, settingData }) => {
  const { 
    addSetting,
    updateSetting,
    loading: settingsLoading,
    error: settingsError
  } = useSettings()
  
  // Debug: să vedem ce date primim
  console.log('🔍 CashRegisterDrawer - Props primite:', { settingId, settingData })
  
  const [cashRegisterSettings, setCashRegisterSettings] = useState({
    receiptSettings: {
      header: 'Cabinet Medical Dr. Popescu',
      address: 'Str. Mihai Viteazu nr. 10, București',
      phone: '+40 21 123 4567',
      email: 'contact@cabinet.ro',
      footer: 'Mulțumim pentru încredere!',
      showLogo: true,
      showQRCode: true
    },
    printerSettings: {
      printerName: '',
      paperWidth: 80,
      autoPrint: true,
      printCopies: 1
    },
    receiptItems: {
      showItemDetails: true,
      showTaxBreakdown: true,
      showPaymentMethod: true,
      showCashierInfo: true
    }
  })

  const [loading, setLoading] = useState(false)

  // Inițializează datele locale cu datele din server
  useEffect(() => {
    if (settingData) {
      // Verifică dacă datele sunt în câmpul data sau direct în obiect
      const sourceData = settingData.data || settingData
      console.log('🔍 CashRegisterDrawer - sourceData:', sourceData)
      
      if (sourceData.cashRegisterSettings) {
        setCashRegisterSettings(sourceData.cashRegisterSettings)
      }
    }
  }, [settingData])

  const handleReceiptChange = (field, value) => {
    setCashRegisterSettings(prev => ({
      ...prev,
      receiptSettings: {
        ...prev.receiptSettings,
        [field]: value
      }
    }))
  }

  const handlePrinterChange = (field, value) => {
    setCashRegisterSettings(prev => ({
      ...prev,
      printerSettings: {
        ...prev.printerSettings,
        [field]: value
      }
    }))
  }

  const handleItemsChange = (field, value) => {
    setCashRegisterSettings(prev => ({
      ...prev,
      receiptItems: {
        ...prev.receiptItems,
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const settingData = {
        settingType: 'cash-register',
        name: 'Casa de marcat',
        isActive: true,
        cashRegisterSettings: cashRegisterSettings
      }

      if (settingId) {
        // Actualizează setarea existentă
        await updateSetting(settingId, settingData)
      } else {
        // Creează o setare nouă
        await addSetting(settingData)
      }
      
      console.log('🔍 CashRegisterDrawer - Setări salvate:', cashRegisterSettings)
      onClose()
    } catch (error) {
      console.error('Eroare la salvarea setărilor:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer onClose={onClose} size="lg">
      <DrawerHeader 
        title="Casa de marcat"
        subtitle="Configurează setările pentru bonurile fiscale și imprimanta"
        onClose={onClose}
      />
      
      <DrawerContent padding="spacious">
        <div className="space-y-8">
          {/* Informații despre setări */}
          {settingData && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Setări existente</h3>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div><strong>Nume setare:</strong> {settingData.name || 'Casa de marcat'}</div>
                <div><strong>Tip:</strong> {settingData.settingType || 'cash-register'}</div>
                <div><strong>Status:</strong> {settingData.isActive ? 'Activ' : 'Inactiv'}</div>
                <div><strong>Ultima actualizare:</strong> {settingData.lastUpdated ? new Date(settingData.lastUpdated).toLocaleString('ro-RO') : 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Setări bon fiscal */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Setări bon fiscal</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Antet bon</label>
                <input
                  type="text"
                  value={cashRegisterSettings.receiptSettings.header}
                  onChange={(e) => handleReceiptChange('header', e.target.value)}
                  placeholder="Numele cabinetului"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Adresă</label>
                <input
                  type="text"
                  value={cashRegisterSettings.receiptSettings.address}
                  onChange={(e) => handleReceiptChange('address', e.target.value)}
                  placeholder="Adresa completă"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={cashRegisterSettings.receiptSettings.phone}
                    onChange={(e) => handleReceiptChange('phone', e.target.value)}
                    placeholder="+40 21 123 4567"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={cashRegisterSettings.receiptSettings.email}
                    onChange={(e) => handleReceiptChange('email', e.target.value)}
                    placeholder="contact@cabinet.ro"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Mesaj de subsol</label>
                <input
                  type="text"
                  value={cashRegisterSettings.receiptSettings.footer}
                  onChange={(e) => handleReceiptChange('footer', e.target.value)}
                  placeholder="Mesaj de mulțumire"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showLogo"
                    checked={cashRegisterSettings.receiptSettings.showLogo}
                    onChange={(e) => handleReceiptChange('showLogo', e.target.checked)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <label htmlFor="showLogo" className="text-sm font-medium">
                    Afișează logo-ul pe bon
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showQRCode"
                    checked={cashRegisterSettings.receiptSettings.showQRCode}
                    onChange={(e) => handleReceiptChange('showQRCode', e.target.checked)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <label htmlFor="showQRCode" className="text-sm font-medium">
                    Afișează codul QR pe bon
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Setări imprimantă */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Printer className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Setări imprimantă</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Numele imprimantei</label>
                <select
                  value={cashRegisterSettings.printerSettings.printerName}
                  onChange={(e) => handlePrinterChange('printerName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Selectează imprimanta</option>
                  <option value="printer1">Imprimantă 1</option>
                  <option value="printer2">Imprimantă 2</option>
                  <option value="default">Imprimantă implicită</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Lățime hârtie (mm)</label>
                <select
                  value={cashRegisterSettings.printerSettings.paperWidth}
                  onChange={(e) => handlePrinterChange('paperWidth', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value={58}>58mm</option>
                  <option value={80}>80mm</option>
                  <option value={112}>112mm</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Copii de imprimat</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={cashRegisterSettings.printerSettings.printCopies}
                  onChange={(e) => handlePrinterChange('printCopies', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="autoPrint"
                  checked={cashRegisterSettings.printerSettings.autoPrint}
                  onChange={(e) => handlePrinterChange('autoPrint', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <label htmlFor="autoPrint" className="text-sm font-medium">
                  Imprimare automată la finalizarea tranzacției
                </label>
              </div>
            </div>
          </div>

          {/* Detalii bon */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Detalii afișate pe bon</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showItemDetails"
                  checked={cashRegisterSettings.receiptItems.showItemDetails}
                  onChange={(e) => handleItemsChange('showItemDetails', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <label htmlFor="showItemDetails" className="text-sm font-medium">
                  Afișează detaliile produselor/serviciilor
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showTaxBreakdown"
                  checked={cashRegisterSettings.receiptItems.showTaxBreakdown}
                  onChange={(e) => handleItemsChange('showTaxBreakdown', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <label htmlFor="showTaxBreakdown" className="text-sm font-medium">
                  Afișează detalierea TVA
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showPaymentMethod"
                  checked={cashRegisterSettings.receiptItems.showPaymentMethod}
                  onChange={(e) => handleItemsChange('showPaymentMethod', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <label htmlFor="showPaymentMethod" className="text-sm font-medium">
                  Afișează metoda de plată
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showCashierInfo"
                  checked={cashRegisterSettings.receiptItems.showCashierInfo}
                  onChange={(e) => handleItemsChange('showCashierInfo', e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <label htmlFor="showCashierInfo" className="text-sm font-medium">
                  Afișează informațiile casierului
                </label>
              </div>
            </div>
          </div>

          {/* Previzualizare bon */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Previzualizare bon fiscal:</h4>
            <div className="bg-white p-4 border rounded text-xs font-mono">
              <div className="text-center font-bold mb-2">
                {cashRegisterSettings.receiptSettings.header}
              </div>
              <div className="text-center text-gray-600 mb-2">
                {cashRegisterSettings.receiptSettings.address}
              </div>
              <div className="text-center text-gray-600 mb-4">
                Tel: {cashRegisterSettings.receiptSettings.phone}
              </div>
              <div className="border-t border-b py-2 mb-2">
                <div>Serviciu medical - 100.00 lei</div>
                <div>TVA 19% - 19.00 lei</div>
              </div>
              <div className="font-bold mb-2">
                TOTAL: 119.00 lei
              </div>
              <div className="text-center text-gray-600 mb-2">
                Plata: Numerar
              </div>
              <div className="text-center text-gray-600 mb-2">
                {cashRegisterSettings.receiptSettings.footer}
              </div>
              {cashRegisterSettings.receiptSettings.showQRCode && (
                <div className="text-center mt-2">
                  [QR CODE]
                </div>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
      
      <DrawerFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Anulează
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvare...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvează
            </>
          )}
        </button>
      </DrawerFooter>
    </Drawer>
  )
}

export default CashRegisterDrawer
