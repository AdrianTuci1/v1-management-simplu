import { Bell, User, Search, Menu, MapPin, Bot, Plus } from 'lucide-react'
import { useAuth } from "react-oidc-context"
import { useDrawer } from '../contexts/DrawerContext'
import { useQuickActionsStore } from '../stores/quickActionsStore'
import { useBusinessConfig } from '../config/businessConfig'
import { useHealthRepository } from '../hooks/useHealthRepository'

const Navbar = ({ currentView, currentLocation }) => {
  const auth = useAuth()
  const { openMenuDrawer, openUserProfileDrawer, openAIAssistantDrawer } = useDrawer()
  const { toggleQuickActions } = useQuickActionsStore()
  const { businessName, BusinessIcon } = useBusinessConfig()
  
  // Health status using repository hook
  const { isHealthy, isOffline, isServerDown, canMakeRequests, performHealthCheck } = useHealthRepository()
  
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


  const userEmail = auth.user?.profile?.email || localStorage.getItem('user-email') || 'Demo User'

  return (
    <header className="absolute top-4 right-4 z-20">
      {/* Floating circles: AI Agent and User */}
      <div className="flex items-center gap-3">
        {/* AI Agent circle */}
        {!isDemoMode && (
          <button
            onClick={openAIAssistantDrawer}
            className="h-12 w-12 rounded-full bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 flex items-center justify-center transition-all duration-200"
            title="Deschide AI Assistant"
          >
            <Bot className="h-5 w-5 text-blue-600" />
          </button>
        )}

        {/* User circle */}
        <button
          onClick={openUserProfileDrawer}
          className="h-12 w-12 rounded-full bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center transition-all duration-200"
          title="Profil Utilizator"
        >
          <User className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </header>
  )
}

export default Navbar
