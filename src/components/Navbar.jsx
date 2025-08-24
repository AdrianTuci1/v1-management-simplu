import { Bell, User, Search, Menu, MapPin, Bot } from 'lucide-react'
import { useDrawer } from '../contexts/DrawerContext'
import { useAIAssistantStore } from '../stores/aiAssistantStore'

const Navbar = ({ currentView, currentLocation }) => {
  const { openMenuDrawer, openUserDrawer } = useDrawer()
  const { toggleAIAssistant } = useAIAssistantStore()
  const getViewTitle = (view) => {
    const titles = {
      dashboard: 'Dashboard',
      'operations-planning': 'Planificare',
      'operations-people': 'Persoane',
      'operations-activities': 'Activități',
      'business-sales': 'Vânzări',
      'business-inventory': 'Inventar',
      'business-processes': 'Procese',
      'financial-billing': 'Facturare',
      'financial-accounting': 'Contabilitate',
      'analytics-reports': 'Rapoarte',
      'analytics-dashboard': 'Analize',
      'admin-access': 'Control Acces',
      'admin-users': 'Utilizatori',
      'admin-settings': 'Setări'
    }
    return titles[view] || 'Dashboard'
  }

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - Menu toggle and title */}
        <div className="flex items-center gap-4">
          <button
            onClick={openMenuDrawer}
            className="btn btn-ghost btn-sm lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold">
              🏢 Business Dashboard
            </h1>
            {currentLocation && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{currentLocation.name}</span>
              </div>
            )}
          </div>
          
          <div className="lg:hidden">
            <h1 className="text-lg font-semibold">
              {getViewTitle(currentView)}
            </h1>
          </div>
        </div>



        {/* Right side - Robot, Notifications and user */}
        <div className="flex items-center gap-2">
          {/* Robot AI Assistant */}
          <button
            onClick={toggleAIAssistant}
            className="btn btn-ghost btn-sm"
            title="Deschide AI Assistant"
          >
            <Bot className="h-5 w-5" />
          </button>



          {/* User menu */}
          <button
            onClick={openUserDrawer}
            className="btn btn-ghost btn-sm flex items-center gap-2"
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden sm:block text-sm font-medium">
              Admin User
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
