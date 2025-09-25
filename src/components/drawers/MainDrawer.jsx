import { X, Bell, User, Settings, Calendar, Loader2 } from 'lucide-react'
import { QuickActionsDrawer, AppointmentDrawer, PatientDrawer, ProductDrawer, UserDrawer, TreatmentDrawer, RoleDrawer, SalesDrawer, WorkingHoursDrawer, CurrencyTaxDrawer, LanguageDrawer, CashRegisterDrawer } from './index.js'
import { useState, useEffect } from 'react'
import appointmentService from '../../services/appointmentService.js'

const Drawer = ({ open, content, onClose }) => {
  if (!open) return null

  const renderContent = () => {
    switch (content?.type) {
      case 'user':
        return <UserContent />
      case 'quick-actions':
        return <QuickActionsDrawer onClose={onClose} />
      case 'appointment':
        return <AppointmentDrawer onClose={onClose} isNewAppointment={content?.isNew} appointmentData={content?.data} />
      case 'new-person':
        return <PatientDrawer onClose={onClose} isNewPatient={true} />
      case 'edit-person':
        return <PatientDrawer onClose={onClose} isNewPatient={false} patientData={content?.data} />
      case 'product':
        return <ProductDrawer isOpen={open} onClose={onClose} product={content?.data} />
      case 'medic':
        return <UserDrawer onClose={onClose} user={content?.data} />
      case 'treatment':
        return <TreatmentDrawer onClose={onClose} isNewTreatment={content?.isNew} treatmentData={content?.data} />
      case 'role':
        return <RoleDrawer onClose={onClose} roleData={content?.data} />
      case 'new-sale':
        return <SalesDrawer isOpen={open} onClose={onClose} />
      case 'working-hours':
        return <WorkingHoursDrawer onClose={onClose} />
      case 'currency-tax':
        return <CurrencyTaxDrawer onClose={onClose} />
      case 'language':
        return <LanguageDrawer onClose={onClose} />
      case 'cash-register':
        return <CashRegisterDrawer onClose={onClose} />
      default:
        return <DefaultContent />
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`drawer ${open ? '' : 'closed'}`}>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </>
  )
}


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


const DefaultContent = () => (
  <div className="p-4">
    <div className="text-center text-muted-foreground">
      Selectează o opțiune din meniu
    </div>
  </div>
)

export default Drawer
