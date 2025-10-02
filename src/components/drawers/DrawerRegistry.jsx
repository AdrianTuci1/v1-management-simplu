import { QuickActionsDrawer, AppointmentDrawer, PatientDrawer, ProductDrawer, UserDrawer, TreatmentDrawer, RoleDrawer, SalesDrawer, WorkingHoursDrawer, CurrencyTaxDrawer, LanguageDrawer, CashRegisterDrawer } from './index.js'
import DataDownloadDrawer from './DataDownloadDrawer'
import StripePaymentDrawer from './StripePaymentDrawer'
import UserProfileDrawer from './UserProfileDrawer'
import AIAssistantComponent from '../AIAssistant'
import SMSConfigurationDrawer from './SMSConfigurationDrawer'
import EmailConfigurationDrawer from './EmailConfigurationDrawer'
import VoiceAgentConfigurationDrawer from './VoiceAgentConfigurationDrawer'
import MetaConfigurationDrawer from './MetaConfigurationDrawer'
import { useState, useEffect } from 'react'
import appointmentService from '../../services/appointmentService.js'

// Registry pentru toate drawerele disponibile
export const DRAWER_REGISTRY = {
  'user': {
    component: 'UserContent',
    requiresData: false
  },
  'quick-actions': {
    component: 'QuickActionsDrawer',
    requiresData: false
  },
  'appointment': {
    component: 'AppointmentDrawer',
    requiresData: true
  },
  'new-person': {
    component: 'PatientDrawer',
    requiresData: false
  },
  'edit-person': {
    component: 'PatientDrawer',
    requiresData: true
  },
  'product': {
    component: 'ProductDrawer',
    requiresData: true
  },
  'medic': {
    component: 'UserDrawer',
    requiresData: true
  },
  'treatment': {
    component: 'TreatmentDrawer',
    requiresData: true
  },
  'role': {
    component: 'RoleDrawer',
    requiresData: true
  },
  'new-sale': {
    component: 'SalesDrawer',
    requiresData: true
  },
  'working-hours': {
    component: 'WorkingHoursDrawer',
    requiresData: false
  },
  'currency-tax': {
    component: 'CurrencyTaxDrawer',
    requiresData: false
  },
  'language': {
    component: 'LanguageDrawer',
    requiresData: false
  },
  'cash-register': {
    component: 'CashRegisterDrawer',
    requiresData: true
  },
  'data-download': {
    component: 'DataDownloadDrawer',
    requiresData: false
  },
  'stripe-payment': {
    component: 'StripePaymentDrawer',
    requiresData: false
  },
  'ai-assistant': {
    component: 'AIAssistantComponent',
    requiresData: false
  },
  'user-profile': {
    component: 'UserProfileDrawer',
    requiresData: false
  },
  'sms-configuration': {
    component: 'SMSConfigurationDrawer',
    requiresData: false
  },
  'email-configuration': {
    component: 'EmailConfigurationDrawer',
    requiresData: false
  },
  'voice-agent-configuration': {
    component: 'VoiceAgentConfigurationDrawer',
    requiresData: false
  },
  'meta-configuration': {
    component: 'MetaConfigurationDrawer',
    requiresData: false
  }
}

// Component pentru conținutul utilizatorului
const UserContent = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  // Load user info and appointments
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true)
      try {
        // Get user info from localStorage
        const savedCognitoData = localStorage.getItem('cognito-data')
        const businessInfo = localStorage.getItem('business-info')
        if (savedCognitoData) {
          const userData = JSON.parse(savedCognitoData)
          let userRole = 'Administrator' // Default role
          
          // Try to get actual role from business info
          if (businessInfo) {
            try {
              const businessData = JSON.parse(businessInfo)
              if (businessData.locations && businessData.locations.length > 0) {
                // Get role from first location (or current location)
                const currentLocation = businessData.locations.find(loc => loc.isCurrent) || businessData.locations[0]
                userRole = currentLocation.role || 'Administrator'
              }
            } catch (e) {
              console.warn('Error parsing business info:', e)
            }
          }
          
          setUserInfo({
            name: userData.profile?.name || userData.user?.name || 'Utilizator',
            email: userData.profile?.email || userData.user?.email || '',
            role: userRole
          })
        }

        // Get user ID for appointments
        const userId = localStorage.getItem('userId') || 'default-user'
        
        // Load appointments for the connected account
        const userAppointments = await appointmentService.getAppointmentsByMedicId(userId)
        setAppointments(userAppointments)
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  return (
    <div className="p-4">
      <div className="space-y-6">
        {/* User Info */}
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold">{userInfo?.name || 'Utilizator'}</h3>
          <p className="text-sm text-muted-foreground">{userInfo?.role || 'Administrator'}</p>
          {userInfo?.email && (
            <p className="text-xs text-muted-foreground mt-1">{userInfo.email}</p>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Acțiuni rapide
          </div>
          
          <button className="menu-item w-full justify-start">
            <User className="h-4 w-4" />
            <span>Editează profil</span>
          </button>
          
          <button className="menu-item w-full justify-start">
            <Settings className="h-4 w-4" />
            <span>Preferințe</span>
          </button>
          
          <button className="menu-item w-full justify-start">
            <Bell className="h-4 w-4" />
            <span>Notificări</span>
          </button>
        </div>
        
        {/* Stats */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Statistici
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg text-center">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <div className="text-lg font-semibold">{appointments.length}</div>
              )}
              <div className="text-xs text-muted-foreground">Programări</div>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-lg font-semibold">-</div>
              <div className="text-xs text-muted-foreground">Clienți</div>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        {appointments.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Programări recente
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {appointments.slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="p-2 bg-muted rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">
                      {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('ro-RO') : 'Data necunoscută'}
                    </span>
                    <span className="text-muted-foreground">
                      {appointment.startTime || 'Ora necunoscută'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {appointment.treatmentType || appointment.type || 'Consultare'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Component pentru conținutul implicit
const DefaultContent = () => (
  <div className="p-4">
    <div className="text-center text-muted-foreground">
      Selectează o opțiune din meniu
    </div>
  </div>
)

// Functie pentru a obține componenta corespunzătoare unui tip de drawer
export const getDrawerComponent = (type) => {
  const registry = DRAWER_REGISTRY[type]
  if (!registry) {
    return DefaultContent
  }

  switch (registry.component) {
    case 'UserContent':
      return UserContent
    case 'QuickActionsDrawer':
      return QuickActionsDrawer
    case 'AppointmentDrawer':
      return AppointmentDrawer
    case 'PatientDrawer':
      return PatientDrawer
    case 'ProductDrawer':
      return ProductDrawer
    case 'UserDrawer':
      return UserDrawer
    case 'TreatmentDrawer':
      return TreatmentDrawer
    case 'RoleDrawer':
      return RoleDrawer
    case 'SalesDrawer':
      return SalesDrawer
    case 'WorkingHoursDrawer':
      return WorkingHoursDrawer
    case 'CurrencyTaxDrawer':
      return CurrencyTaxDrawer
    case 'LanguageDrawer':
      return LanguageDrawer
    case 'CashRegisterDrawer':
      return CashRegisterDrawer
    case 'DataDownloadDrawer':
      return DataDownloadDrawer
    case 'StripePaymentDrawer':
      return StripePaymentDrawer
    case 'AIAssistantComponent':
      return AIAssistantComponent
    case 'UserProfileDrawer':
      return UserProfileDrawer
    case 'SMSConfigurationDrawer':
      return SMSConfigurationDrawer
    case 'EmailConfigurationDrawer':
      return EmailConfigurationDrawer
    case 'VoiceAgentConfigurationDrawer':
      return VoiceAgentConfigurationDrawer
    case 'MetaConfigurationDrawer':
      return MetaConfigurationDrawer
    default:
      return DefaultContent
  }
}

// Functie pentru a verifica dacă un drawer necesită date
export const drawerRequiresData = (type) => {
  const registry = DRAWER_REGISTRY[type]
  return registry ? registry.requiresData : false
}

// Functie pentru a obține toate tipurile de drawere disponibile
export const getAvailableDrawerTypes = () => {
  return Object.keys(DRAWER_REGISTRY)
}

// Functie pentru a obține informațiile despre un drawer
export const getDrawerInfo = (type) => {
  return DRAWER_REGISTRY[type] || null
}
