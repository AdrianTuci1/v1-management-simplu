import { Settings, Clock, DollarSign, Globe, Receipt, Download, CreditCard, ChevronRight } from 'lucide-react'
import { useDrawer } from '../../contexts/DrawerContext'
import { useSettings } from '../../hooks/useSettings'
import useSettingsStore from '../../stores/settingsStore'

const AdminSettings = () => {
  const { openDrawer } = useDrawer()
  const { getSettingStatus } = useSettingsStore()
  const { getSettingsByType } = useSettings()

  const settingsCategories = [
    {
      id: 'working-hours',
      title: 'Program de funcționare și detalii locație',
      description: 'Configurează orele de funcționare și informațiile despre locație',
      icon: Clock
    },
    {
      id: 'currency-tax',
      title: 'Monedă și cota TVA',
      description: 'Configurează moneda și ratele de TVA pentru facturare',
      icon: DollarSign
    },
    {
      id: 'language',
      title: 'Limbă',
      description: 'Selectează limba interfeței',
      icon: Globe
    },
    {
      id: 'cash-register',
      title: 'Casa de marcat',
      description: 'Configurează setările pentru bonurile fiscale și imprimanta',
      icon: Receipt
    },
    {
      id: 'data-download',
      title: 'Descărcare date',
      description: 'Exportă datele sistemului în diferite formate (CSV, PDF, Excel)',
      icon: Download
    },
    {
      id: 'stripe-payment',
      title: 'Configurare plată Stripe',
      description: 'Configurează integrarea cu Stripe pentru plăți online',
      icon: CreditCard
    }
  ]

  const handleSettingClick = (settingId) => {
    console.log('🔍 AdminSettings - handleSettingClick pentru:', settingId)
    
    // Pentru setări care necesită gestionare specială
    if (['working-hours', 'currency-tax', 'cash-register'].includes(settingId)) {
      const settings = getSettingsByType(settingId)
      console.log(`🔍 AdminSettings - ${settingId} settings găsite:`, settings)
      
      if (settings.length > 0) {
        console.log(`🔍 AdminSettings - Deschidem drawer cu date existente pentru ${settingId}:`, settings[0])
        // Deschide drawer-ul cu ID-ul real al setării
        openDrawer({ 
          type: settingId,
          settingId: settings[0].id,
          settingData: settings[0]
        })
      } else {
        console.log(`🔍 AdminSettings - Deschidem drawer pentru setare nouă ${settingId}`)
        // Dacă nu există setare, deschide drawer-ul pentru a crea una nouă
        openDrawer({ 
          type: settingId,
          settingId: null,
          settingData: null
        })
      }
    } else {
      // Pentru alte tipuri de setări, folosește ID-ul direct
      openDrawer({ type: settingId })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Setări</h1>
        <p className="text-muted-foreground">Configurează sistemul și preferințele</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsCategories.map((setting) => {
          const Icon = setting.icon
          const status = getSettingStatus(setting.id)
          const isConfigured = status.configured
          
          return (
            <div
              key={setting.id}
              onClick={() => handleSettingClick(setting.id)}
              className="group cursor-pointer p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded ${
                  isConfigured 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold mb-1 group-hover:text-primary transition-colors">
                    {setting.title}
                  </h3>
                  <p className="text-muted-foreground text-xs mb-2">
                    {setting.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isConfigured
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isConfigured ? 'Configurat' : 'Neconfigurat'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {status.lastUpdated}
                      </span>
                    </div>
                    
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Informații suplimentare */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Despre setările sistemului</h4>
            <p className="text-sm text-blue-700">
              Aceste setări afectează funcționarea întregului sistem. Modificările se aplică imediat 
              și sunt salvate automat. Pentru asistență tehnică, contactează administratorul sistemului.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
