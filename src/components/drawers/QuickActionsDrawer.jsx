import { 
  Calendar, 
  Users, 
  TrendingUp, 
  X
} from 'lucide-react'
import { useDrawer } from '../../contexts/DrawerContext'
import { useQuickActionsStore } from '../../stores/quickActionsStore'
import { useSalesDrawerStore } from '../../stores/salesDrawerStore'
import { cn } from '../../lib/utils'

const QuickActionsDrawer = ({ className }) => {
  const { openAppointmentDrawer } = useDrawer()
  const { isOpen, closeQuickActions } = useQuickActionsStore()
  const { openSalesDrawer } = useSalesDrawerStore()
  
  const quickActions = [
    {
      title: 'Programare nouă',
      description: 'Creează o nouă programare pentru client',
      icon: Calendar,
      color: 'bg-blue-500',
      action: () => {
        closeQuickActions()
        openAppointmentDrawer()
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
        closeQuickActions()
      }
    },
    {
      title: 'Vânzare nouă',
      description: 'Înregistrează o nouă vânzare',
      icon: TrendingUp,
      color: 'bg-purple-500',
      action: () => {
        openSalesDrawer()
        closeQuickActions()
      }
    }
  ]

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed top-20 right-5 z-50 bg-background border rounded-lg shadow-md overflow-hidden transition-all duration-250 ease-out bg-white",
        "w-[320px] max-h-[400px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold">Acțiuni Rapide</h3>
          <p className="text-xs text-muted-foreground">
            Funcționalități rapide
          </p>
        </div>
        <button
          onClick={closeQuickActions}
          className="h-6 w-6 rounded-sm flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="space-y-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="group w-full p-3 border border-border rounded-md hover:border-primary/50 hover:bg-muted/50 transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-md ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default QuickActionsDrawer
