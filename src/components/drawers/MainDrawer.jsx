import { X, Bell, User, Settings, Search, Calendar } from 'lucide-react'
import { QuickActionsDrawer, AppointmentDrawer, PatientDrawer, ProductDrawer, UserDrawer, TreatmentDrawer, RoleDrawer } from './index.js'

const Drawer = ({ open, content, onClose }) => {
  if (!open) return null

  const renderContent = () => {
    switch (content?.type) {
      case 'menu':
        return <MenuContent />
      case 'notifications':
        return <NotificationsContent />
      case 'user':
        return <UserContent />
      case 'search':
        return <SearchContent />
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

const MenuContent = () => (
  <div className="p-4">
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground mb-4">
        Navigare rapidă
      </div>
      
      <button className="menu-item w-full justify-start">
        <Search className="h-4 w-4" />
        <span>Căutare globală</span>
      </button>
      
      <button className="menu-item w-full justify-start">
        <Bell className="h-4 w-4" />
        <span>Notificări</span>
      </button>
      
      <button className="menu-item w-full justify-start">
        <User className="h-4 w-4" />
        <span>Profil</span>
      </button>
      
      <button className="menu-item w-full justify-start">
        <Settings className="h-4 w-4" />
        <span>Setări</span>
      </button>
    </div>
  </div>
)

const NotificationsContent = () => (
  <div className="p-4">
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        Notificări recente
      </div>
      
      <div className="space-y-3">
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
            <div className="flex-1">
              <div className="text-sm font-medium">Programare nouă</div>
              <div className="text-xs text-muted-foreground">
                Ion Marinescu - Control de rutină
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Acum 5 minute
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-destructive mt-2"></div>
            <div className="flex-1">
              <div className="text-sm font-medium">Factură neplătită</div>
              <div className="text-xs text-muted-foreground">
                #2024-004 - Dumitrescu Mihai
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Acum 1 oră
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-muted-foreground mt-2"></div>
            <div className="flex-1">
              <div className="text-sm font-medium">Stoc scăzut</div>
              <div className="text-xs text-muted-foreground">
                Materiale dentare - 5 unități rămase
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Acum 2 ore
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const UserContent = () => (
  <div className="p-4">
    <div className="space-y-6">
      {/* User Info */}
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
          <User className="h-8 w-8 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Admin User</h3>
        <p className="text-sm text-muted-foreground">Administrator</p>
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
            <div className="text-lg font-semibold">156</div>
            <div className="text-xs text-muted-foreground">Programări</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <div className="text-lg font-semibold">89</div>
            <div className="text-xs text-muted-foreground">Clienți</div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const SearchContent = () => (
  <div className="p-4">
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Caută în toate secțiunile..."
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      
      <div className="text-sm font-medium text-muted-foreground">
        Căutări recente
      </div>
      
      <div className="space-y-2">
        <button className="w-full text-left p-2 hover:bg-muted rounded-md text-sm">
          Ion Marinescu
        </button>
        <button className="w-full text-left p-2 hover:bg-muted rounded-md text-sm">
          Obturație
        </button>
        <button className="w-full text-left p-2 hover:bg-muted rounded-md text-sm">
          Factura #2024-001
        </button>
      </div>
    </div>
  </div>
)

const DefaultContent = () => (
  <div className="p-4">
    <div className="text-center text-muted-foreground">
      Selectează o opțiune din meniu
    </div>
  </div>
)

export default Drawer
