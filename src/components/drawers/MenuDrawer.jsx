import { Search, Bell, User, Settings } from 'lucide-react'

const MenuDrawer = ({ onClose }) => {
  return (
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
}

export default MenuDrawer
