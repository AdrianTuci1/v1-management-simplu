import { 
  X, 
  Plus, 
  Calendar, 
  Users, 
  TrendingUp, 
  CreditCard, 
  FileText, 
  Package, 
  DollarSign, 
  Settings
} from 'lucide-react'
import useDrawer from '../../contexts/DrawerContext'

const QuickActionsDrawer = ({ onClose, zIndex = 50 }) => {
  const openDrawer = useDrawer()
  const quickActions = [
    {
      title: 'Programare nouă',
      description: 'Creează o nouă programare pentru client',
      icon: Calendar,
      color: 'bg-blue-500',
      action: () => {
        onClose()
        openDrawer('appointment')
      }
    },
    {
      title: 'Client nou',
      description: 'Adaugă un nou client în sistem',
      icon: Users,
      color: 'bg-green-500',
      action: () => {
        // TODO: Implement new client action
        console.log('New client')
      }
    },
    {
      title: 'Vânzare nouă',
      description: 'Înregistrează o nouă vânzare',
      icon: TrendingUp,
      color: 'bg-purple-500',
      action: () => {
        // TODO: Implement new sale action
        console.log('New sale')
      }
    },
    {
      title: 'Factură nouă',
      description: 'Generează o nouă factură',
      icon: CreditCard,
      color: 'bg-orange-500',
      action: () => {
        // TODO: Implement new invoice action
        console.log('New invoice')
      }
    },
    {
      title: 'Raport nou',
      description: 'Generează un raport personalizat',
      icon: FileText,
      color: 'bg-indigo-500',
      action: () => {
        // TODO: Implement new report action
        console.log('New report')
      }
    },
    {
      title: 'Stoc nou',
      description: 'Adaugă produse în inventar',
      icon: Package,
      color: 'bg-teal-500',
      action: () => {
        // TODO: Implement new inventory action
        console.log('New inventory')
      }
    },
    {
      title: 'Plată nouă',
      description: 'Înregistrează o nouă plată',
      icon: DollarSign,
      color: 'bg-emerald-500',
      action: () => {
        // TODO: Implement new payment action
        console.log('New payment')
      }
    },
    {
      title: 'Setări rapide',
      description: 'Accesează setările sistemului',
      icon: Settings,
      color: 'bg-gray-500',
      action: () => {
        // TODO: Implement quick settings action
        console.log('Quick settings')
      }
    }
  ]

  return (
    <>
      {/* Backdrop - temporar comentat pentru test */}
      {/* <div 
        className="fixed inset-0 bg-black/50"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      /> */}
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-96 bg-white shadow-xl flex flex-col border-4 border-red-500" style={{ zIndex: 100 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Acțiuni Rapide</h2>
            <p className="text-sm text-muted-foreground">
              Accesează rapid funcționalitățile cele mai folosite
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.action()
                  onClose()
                }}
                className="group relative p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default QuickActionsDrawer
