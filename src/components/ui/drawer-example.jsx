import React, { useState } from 'react'
import { 
  Drawer, 
  DrawerHeader, 
  DrawerNavigation, 
  DrawerContent, 
  DrawerFooter 
} from './drawer'
import { User, Settings, FileText, Calendar } from 'lucide-react'

const DrawerExample = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMenu, setCurrentMenu] = useState(1)

  const navigationItems = [
    { id: 1, label: 'Profil', icon: User },
    { id: 2, label: 'Setări', icon: Settings },
    { id: 3, label: 'Documente', icon: FileText },
    { id: 4, label: 'Programări', icon: Calendar }
  ]

  const renderContent = () => {
    switch (currentMenu) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              Informații profil
            </div>
            <p>Conținut pentru profil...</p>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              Setări aplicație
            </div>
            <p>Conținut pentru setări...</p>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              Documente și fișiere
            </div>
            <p>Conținut pentru documente...</p>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              Programări și evenimente
            </div>
            <p>Conținut pentru programări...</p>
          </div>
        )
      default:
        return <div>Selectează o opțiune</div>
    }
  }

  return (
    <div className="p-4">
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-primary"
      >
        Deschide Drawer Exemplu
      </button>

      {isOpen && (
        <Drawer onClose={() => setIsOpen(false)}>
          <DrawerHeader
            title="Drawer Exemplu"
            subtitle="Demonstrație componentă standardizată"
            onClose={() => setIsOpen(false)}
          />
          
          <DrawerNavigation
            items={navigationItems}
            activeItem={currentMenu}
            onItemChange={setCurrentMenu}
          />
          
          <DrawerContent>
            {renderContent()}
          </DrawerContent>
          
          <DrawerFooter>
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-outline"
              >
                Anulează
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-primary"
              >
                Salvează
              </button>
            </div>
          </DrawerFooter>
        </Drawer>
      )}
    </div>
  )
}

export default DrawerExample
