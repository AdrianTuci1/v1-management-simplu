import { useState } from 'react'
import { Globe, Save } from 'lucide-react'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerContent, 
  DrawerFooter 
} from '../ui/drawer'
import useSettingsStore from '../../stores/settingsStore'

const LanguageDrawer = ({ onClose }) => {
  const { language, updateLanguage } = useSettingsStore()
  const [loading, setLoading] = useState(false)

  const languages = [
    { code: 'ro', name: 'Română', flag: '🇷🇴' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ]

  const handleLanguageChange = (selectedLanguage) => {
    updateLanguage(selectedLanguage)
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
        title="Setări limbă"
        subtitle="Selectează limba interfeței"
        onClose={onClose}
      />
      
      <DrawerContent padding="default">
        <div className="space-y-6">
          {/* Limba interfeței */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Limba interfeței</h3>
            </div>
            
            <div className="space-y-2">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className={`p-3 border-2 rounded cursor-pointer transition-all ${
                    language.code === lang.code
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleLanguageChange(lang)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{lang.flag}</span>
                    <div>
                      <div className="font-medium text-sm">{lang.name}</div>
                      <div className="text-xs text-muted-foreground">{lang.code.toUpperCase()}</div>
                    </div>
                    {language.code === lang.code && (
                      <div className="ml-auto text-primary font-bold text-sm">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
              <span className="text-muted-foreground">Limba selectată: </span>
              <span className="font-medium">{language.name}</span>
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

export default LanguageDrawer
