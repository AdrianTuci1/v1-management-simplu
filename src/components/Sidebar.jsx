import { useState } from 'react'
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  Package,
  RefreshCw,
  CreditCard,
  DollarSign,
  BarChart3,
  PieChart,
  Shield,
  User,
  Settings,
  Home
} from 'lucide-react'
import LocationSwitcher from './LocationSwitcher'

const Sidebar = ({ collapsed, currentView, onViewChange, onToggle, currentLocation, onLocationChange }) => {
  const [expandedMenus, setExpandedMenus] = useState(['operations'])

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      view: 'dashboard'
    },
    {
      id: 'operations',
      label: 'OPERAȚIUNI',
      icon: Activity,
      submenu: [
        {
          id: 'operations-planning',
          label: 'Planificare',
          icon: Calendar,
          view: 'operations-planning'
        },
        {
          id: 'operations-people',
          label: 'Persoane',
          icon: Users,
          view: 'operations-people'
        },
        {
          id: 'operations-treatments',
          label: 'Tratamente',
          icon: Activity,
          view: 'operations-treatments'
        }
      ]
    },
    {
      id: 'business',
      label: 'BUSINESS',
      icon: TrendingUp,
      submenu: [
        {
          id: 'business-sales',
          label: 'Vânzări',
          icon: TrendingUp,
          view: 'business-sales'
        },
        {
          id: 'business-inventory',
          label: 'Inventar',
          icon: Package,
          view: 'business-inventory'
        }
      ]
    },
    {
      id: 'ai-agent',
      label: 'AI AGENT',
      icon: Activity,
      submenu: [
        {
          id: 'operations-activities',
          label: 'Activități',
          icon: Activity,
          view: 'operations-activities'
        },
        {
          id: 'business-processes',
          label: 'Procese',
          icon: RefreshCw,
          view: 'business-processes'
        }
      ]
    },
    {
      id: 'financial',
      label: 'FINANCIAR',
      icon: CreditCard,
      submenu: [
        {
          id: 'financial-billing',
          label: 'Facturare',
          icon: CreditCard,
          view: 'financial-billing'
        },
        {
          id: 'financial-accounting',
          label: 'Contabilitate',
          icon: DollarSign,
          view: 'financial-accounting'
        }
      ]
    },
    {
      id: 'analytics',
      label: 'ANALIZE',
      icon: BarChart3,
      submenu: [
        {
          id: 'analytics-reports',
          label: 'Rapoarte',
          icon: BarChart3,
          view: 'analytics-reports'
        },
        {
          id: 'analytics-dashboard',
          label: 'Dashboard',
          icon: PieChart,
          view: 'analytics-dashboard'
        }
      ]
    },
    {
      id: 'admin',
      label: 'ADMINISTRARE',
      icon: Settings,
      submenu: [
        {
          id: 'admin-access',
          label: 'Control Acces',
          icon: Shield,
          view: 'admin-access'
        },
        {
          id: 'admin-users',
          label: 'Utilizatori',
          icon: User,
          view: 'admin-users'
        },
        {
          id: 'admin-settings',
          label: 'Setări',
          icon: Settings,
          view: 'admin-settings'
        }
      ]
    }
  ]

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  const isMenuExpanded = (menuId) => expandedMenus.includes(menuId)
  const isActive = (view) => currentView === view

  return (
    <aside className={`sidebar bg-card border-r border-border flex flex-col transition-all duration-300 ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={onToggle}
          className="btn btn-ghost btn-sm"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-2">
        {menuItems.map((item) => (
          <div key={item.id}>
            {/* Menu Item */}
            <button
              onClick={() => {
                if (item.submenu) {
                  toggleMenu(item.id)
                } else {
                  onViewChange(item.view)
                }
              }}
              className={`menu-item w-full justify-between ${
                isActive(item.view) ? 'active' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {!collapsed && <span>{item.label}</span>}
              </div>
              {item.submenu && !collapsed && (
                <ChevronRight 
                  className={`h-4 w-4 transition-transform ${
                    isMenuExpanded(item.id) ? 'rotate-90' : ''
                  }`} 
                />
              )}
            </button>

            {/* Submenu */}
            {item.submenu && !collapsed && isMenuExpanded(item.id) && (
              <div className="ml-6 mt-1 space-y-1">
                {item.submenu.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => onViewChange(subItem.view)}
                    className={`menu-item w-full justify-start ${
                      isActive(subItem.view) ? 'active' : ''
                    }`}
                  >
                    <subItem.icon className="h-4 w-4" />
                    <span>{subItem.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Collapsed submenu indicator */}
            {item.submenu && collapsed && (
              <div className="relative">
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary"></div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Location Switcher */}
      <div className="border-t border-border">
        <LocationSwitcher
          collapsed={collapsed}
          currentLocation={currentLocation}
          onLocationChange={onLocationChange}
        />
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            v1.0.0
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
