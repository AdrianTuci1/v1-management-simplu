import React from 'react'
import { Layers, X, ChevronDown } from 'lucide-react'
import { useDrawerStackStore } from '../stores/drawerStackStore'
import { Button } from './ui/button'

const DrawerStackIndicator = () => {
  const { 
    drawerStack, 
    getStackSize, 
    getCurrentDrawer, 
    popDrawer, 
    removeDrawer,
    clearStack 
  } = useDrawerStackStore()
  
  const stackSize = getStackSize()
  const currentDrawer = getCurrentDrawer()
  
  if (stackSize === 0) return null
  
  const getDrawerTypeLabel = (type) => {
    const labels = {
      'user': 'Utilizator',
      'quick-actions': 'Acțiuni rapide',
      'appointment': 'Programare',
      'new-person': 'Pacient nou',
      'edit-person': 'Editare pacient',
      'product': 'Produs',
      'medic': 'Medic',
      'treatment': 'Tratament',
      'role': 'Rol',
      'new-sale': 'Vânzare nouă',
      'working-hours': 'Ore de lucru',
      'currency-tax': 'Monedă și taxe',
      'language': 'Limba',
      'cash-register': 'Casa de marcat',
      'data-download': 'Descărcare date',
      'stripe-payment': 'Plată Stripe',
      'ai-assistant': 'AI Assistant'
    }
    return labels[type] || type
  }
  
  const handleCloseCurrent = () => {
    popDrawer()
  }
  
  const handleCloseAll = () => {
    clearStack()
  }
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Drawere ({stackSize})
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseCurrent}
              className="h-6 w-6 p-0"
              title="Închide ultimul drawer"
            >
              <X className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseAll}
              className="h-6 w-6 p-0"
              title="Închide toate drawerele"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Current Drawer */}
        {currentDrawer && (
          <div className="text-xs text-muted-foreground mb-2">
            Activ: {getDrawerTypeLabel(currentDrawer.type)}
            {currentDrawer.isNew && ' (nou)'}
          </div>
        )}
        
        {/* Stack List */}
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {drawerStack.map((drawer, index) => (
            <div
              key={drawer.id}
              className={`flex items-center justify-between p-1 rounded text-xs ${
                index === drawerStack.length - 1 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              <span>
                {getDrawerTypeLabel(drawer.type)}
                {drawer.isNew && ' (nou)'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDrawer(drawer.id)}
                className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DrawerStackIndicator
