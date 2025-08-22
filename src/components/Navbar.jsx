import { Bell, User, Search, Menu } from 'lucide-react'

const Navbar = ({ currentView, onDrawerOpen }) => {
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

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - Menu toggle and title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onDrawerOpen({ type: 'menu' })}
            className="btn btn-ghost btn-sm lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold">
              🏢 Business Dashboard
            </h1>
          </div>
          
          <div className="lg:hidden">
            <h1 className="text-lg font-semibold">
              {getViewTitle(currentView)}
            </h1>
          </div>
        </div>

        {/* Center - Search (desktop only) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Caută..."
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>

        {/* Right side - Notifications and user */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={() => onDrawerOpen({ type: 'notifications' })}
            className="btn btn-ghost btn-sm relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive"></span>
          </button>

          {/* User menu */}
          <button
            onClick={() => onDrawerOpen({ type: 'user' })}
            className="btn btn-ghost btn-sm flex items-center gap-2"
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden sm:block text-sm font-medium">
              Admin User
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
