import { Bell, User, Search, Menu, MapPin, Bot, Plus, LogOut } from 'lucide-react'
import { useAuth } from "react-oidc-context"
import { useDrawer } from '../contexts/DrawerContext'
import { useAIAssistantStore } from '../stores/aiAssistantStore'
import { useQuickActionsStore } from '../stores/quickActionsStore'
import { useBusinessConfig } from '../config/businessConfig'

const Navbar = ({ currentView, currentLocation }) => {
  const auth = useAuth()
  const { openMenuDrawer, openUserDrawer } = useDrawer()
  const { toggleAIAssistant } = useAIAssistantStore()
  const { toggleQuickActions } = useQuickActionsStore()
  const { businessName, BusinessIcon } = useBusinessConfig()
  
  // Check if we're in demo mode
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  
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

  const handleSignOut = () => {
    const clientId = "ar2m2qg3gp4a0b4cld09aegdb";
    const logoutUri = window.location.href;
    const cognitoDomain = "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_KUaE0MTcQ";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  }

  const userEmail = auth.user?.profile?.email || localStorage.getItem('user-email') || 'Demo User'

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
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <BusinessIcon className="h-5 w-5" />
            </h1>
          </div>
          
          <div className="lg:hidden">
            <h1 className="text-lg font-semibold">
              {getViewTitle(currentView)}
            </h1>
          </div>
        </div>

        {/* Right side - Robot, Notifications and user */}
        <div className="flex items-center gap-2">
          {/* Robot AI Assistant - Hidden in demo mode */}
          {!isDemoMode && (
            <button
              onClick={toggleAIAssistant}
              className="btn btn-ghost btn-sm"
              title="Deschide AI Assistant"
            >
              <Bot className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={toggleQuickActions}
            className="btn btn-ghost btn-sm"
            title="Acțiuni Rapide"
          >
            <Plus className="h-5 w-5" />
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
              {userEmail}
            </span>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="btn btn-ghost btn-sm"
            title="Deconectare"
          >
            <LogOut className="h-5 w-5" />
          </button>

        </div>
      </div>
    </header>
  )
}

export default Navbar
