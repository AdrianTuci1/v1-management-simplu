import { useState } from 'react'
import { DollarSign, Percent, Save } from 'lucide-react'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import useSettingsStore from '../../stores/settingsStore'

const CurrencyTaxDrawer = ({ onClose }) => {
  const { 
    currency, 
    taxSettings, 
    updateCurrency, 
    updateTaxSettings 
  } = useSettingsStore()
  
  const [loading, setLoading] = useState(false)

  const currencies = [
    { code: 'RON', name: 'Leu românesc', symbol: 'lei' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'Dolar american', symbol: '$' },
    { code: 'GBP', name: 'Lira sterlină', symbol: '£' }
  ]

  const handleCurrencyChange = (selectedCurrency) => {
    updateCurrency(selectedCurrency)
  }

  const handleTaxRateChange = (id, field, value) => {
    const updatedRates = taxSettings.vatRates.map(rate => 
      rate.id === id ? { ...rate, [field]: value } : rate
    )
    updateTaxSettings({ vatRates: updatedRates })
  }

  const addTaxRate = () => {
    const newId = Math.max(...taxSettings.vatRates.map(r => r.id)) + 1
    const updatedRates = [...taxSettings.vatRates, {
      id: newId,
      name: 'TVA Nou',
      rate: 0,
      enabled: true
    }]
    updateTaxSettings({ vatRates: updatedRates })
  }

  const removeTaxRate = (id) => {
    const updatedRates = taxSettings.vatRates.filter(rate => rate.id !== id)
    updateTaxSettings({ vatRates: updatedRates })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Setările sunt deja salvate în store
      await new Promise(resolve => setTimeout(resolve, 500))
      onClose()
    } catch (error) {
      console.error('Eroare la salvarea setărilor:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer onClose={onClose} size="default">
      <DrawerHeader 
        title="Monedă și cota TVA"
        subtitle="Configurează moneda și ratele de TVA"
        onClose={onClose}
      />
      
      <DrawerContent padding="default">
        <div className="space-y-6">
          {/* Setări monedă */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Moneda</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Selectează moneda</label>
                <select
                  value={currency.code}
                  onChange={(e) => {
                    const selectedCurrency = currencies.find(c => c.code === e.target.value)
                    handleCurrencyChange(selectedCurrency)
                  }}
                  className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="p-2 bg-gray-50 rounded text-sm">
                <span className="text-muted-foreground">Moneda selectată: </span>
                <span className="font-medium">{currency.name} ({currency.symbol})</span>
              </div>
            </div>
          </div>

          {/* Setări TVA */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold">Rate TVA</h3>
              </div>
              <button
                onClick={addTaxRate}
                className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90"
              >
                Adaugă
              </button>
            </div>
            
            <div className="space-y-2">
              {taxSettings.vatRates.map((rate) => (
                <div key={rate.id} className="flex items-center gap-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={rate.enabled}
                    onChange={(e) => handleTaxRateChange(rate.id, 'enabled', e.target.checked)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={rate.name}
                    onChange={(e) => handleTaxRateChange(rate.id, 'name', e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={rate.rate}
                    onChange={(e) => handleTaxRateChange(rate.id, 'rate', parseFloat(e.target.value))}
                    className="w-16 px-1 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <button
                    onClick={() => removeTaxRate(rate.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-3">
              <label className="block text-xs font-medium mb-1">TVA implicit pentru facturi noi</label>
              <select
                value={taxSettings.defaultVAT}
                onChange={(e) => updateTaxSettings({ defaultVAT: parseFloat(e.target.value) })}
                className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-transparent"
              >
                {taxSettings.vatRates.filter(rate => rate.enabled).map(rate => (
                  <option key={rate.id} value={rate.rate}>
                    {rate.name} ({rate.rate}%)
                  </option>
                ))}
              </select>
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

export default CurrencyTaxDrawer
