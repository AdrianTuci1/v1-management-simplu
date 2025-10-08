import { useState, useEffect } from 'react'
import { Calendar, FileText, Image, User, Pill } from 'lucide-react'
import NewSidebar from './components/NewSidebar'
import DraftMainDrawer from './components/drawers/DraftMainDrawer'
import { Drawer, DrawerExternalNavigation } from './components/ui/drawer'
import Dashboard from './components/Dashboard'
import AuthScreen from './components/AuthScreen'
import LoadingScreen from './components/LoadingScreen'
import AccessDenied from './components/AccessDenied'
import QuickActionsDrawer from './components/drawers/QuickActionsDrawer'
import SalesDrawer from './components/drawers/SalesDrawer'
import InvoiceDrawer from './components/drawers/InvoiceDrawer'
import InvoiceClientDrawer from './components/drawers/InvoiceClientDrawer'
import authService from './services/authService'
import cognitoAuthService from './services/cognitoAuthService'
import { DrawerProvider, useDrawer } from './contexts/DrawerContext'
import { connectWebSocket } from './data/infrastructure/websocketClient'

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const { drawerOpen, drawerContent, closeDrawer } = useDrawer()
  
  // State pentru navigația externă
  const [externalNavigationState, setExternalNavigationState] = useState({
    appointment: 1,
    'new-person': 1,
    'edit-person': 1
  })

  // Check if demo mode is enabled
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

  // Helper function to safely clean URL parameters
  const cleanUrlParameters = () => {
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.has('code') || url.searchParams.has('state')) {
        url.searchParams.delete('code')
        url.searchParams.delete('state')
        window.history.replaceState({}, document.title, url.pathname + url.search)
        console.log('URL parameters cleaned successfully')
      }
    } catch (error) {
      console.error('Error cleaning URL parameters:', error)
    }
  }

  // Initialize app data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true)
        
        // Check for OAuth callback (code parameter from Cognito/Google)
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        
        if (code && !isDemoMode) {
          console.log('OAuth callback detected, processing...')
          try {
            // Handle OAuth callback from Cognito
            await cognitoAuthService.handleOAuthCallback(code)
            
            // Clean URL and reload to initialize app with new auth
            window.history.replaceState({}, document.title, window.location.pathname)
            window.location.reload()
            return
          } catch (error) {
            console.error('OAuth callback error:', error)
            setError('Eroare la procesarea autentificării. Te rugăm să încerci din nou.')
            cleanUrlParameters()
          }
        }
        
        // Load saved UI state FIRST
        const savedView = localStorage.getItem('dashboard-view')
        const savedSidebarState = localStorage.getItem('sidebar-collapsed')
        const savedLocation = localStorage.getItem('selected-location')
        
        console.log('Loading saved state:', { savedView, savedSidebarState, savedLocation })
        
        // Set UI state immediately
        if (savedView) {
          console.log('Restoring view from localStorage:', savedView)
          setCurrentView(savedView)
        }
        if (savedSidebarState) {
          setSidebarCollapsed(JSON.parse(savedSidebarState))
        }
        
        // Initialize authentication and business data
        const data = await authService.initialize()
        setUserData(data)
        
        // Start token refresh monitoring for authenticated users
        if (!isDemoMode && authService.isAuthenticated()) {
          cognitoAuthService.startTokenRefreshMonitoring()
        }
        
        // Check access permissions
        if (authService.shouldDenyAccess(data)) {
          setAccessDenied(true)
          return
        }
        
        // Set default location
        if (savedLocation) {
          setSelectedLocation(JSON.parse(savedLocation))
        } else {
          const defaultLocation = authService.getDefaultLocation(data)
          if (defaultLocation) {
            setSelectedLocation(defaultLocation)
            localStorage.setItem('selected-location', JSON.stringify(defaultLocation))
          }
        }
        
        // Clean up URL parameters AFTER successful initialization to prevent auth loops
        cleanUrlParameters()
      } catch (error) {
        console.error('Error initializing app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()

    // Cleanup: stop token refresh monitoring when component unmounts
    return () => {
      if (!isDemoMode) {
        cognitoAuthService.stopTokenRefreshMonitoring()
      }
    }
  }, [])

  // Initializează WebSocket după ce avem locația selectată
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/socket'
    try {
      connectWebSocket(wsUrl)
    } catch (e) {
      console.warn('WebSocket init failed', e)
    }
  }, [])


  // Save state to localStorage when it changes
  useEffect(() => {
    // Only save if we're not in the initial loading phase
    if (!isLoading) {
      console.log('Saving current view to localStorage:', currentView)
      localStorage.setItem('dashboard-view', currentView)
    }
  }, [currentView, isLoading])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  const handleViewChange = (view) => {
    console.log('Changing view to:', view)
    console.log('Current localStorage dashboard-view:', localStorage.getItem('dashboard-view'))
    setCurrentView(view)
    // Force save immediately for testing
    localStorage.setItem('dashboard-view', view)
    console.log('Saved to localStorage:', view)
  }

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleLocationChange = (location) => {
    setSelectedLocation(location)
    localStorage.setItem('selected-location', JSON.stringify(location))
  }

  // Funcții pentru navigația externă
  const getExternalNavigationItems = (drawerType) => {
    switch (drawerType) {
      case 'appointment':
        return [
          { id: 1, label: 'Detalii', icon: Calendar },
          { id: 2, label: 'Note', icon: FileText },
          { id: 3, label: 'Galerie', icon: Image }
        ]
      case 'new-person':
      case 'edit-person':
        return [
          { id: 1, label: 'Detalii pacient', icon: User },
          { id: 2, label: 'Note dentare', icon: Pill },
          { id: 3, label: 'Programări', icon: Calendar }
        ]
      default:
        return []
    }
  }

  const getCurrentNavigationItem = (drawerType) => {
    return externalNavigationState[drawerType] || 1
  }

  const handleNavigationChange = (id, drawerType) => {
    setExternalNavigationState(prev => ({
      ...prev,
      [drawerType]: id
    }))
  }

  // Show auth screen if not authenticated and not in demo mode
  if (!isDemoMode && !authService.isAuthenticated()) {
    return <AuthScreen />
  }

  // Show loading screen while processing
  if (isLoading) {
    return <LoadingScreen message="Se încarcă aplicația..." />
  }

  // Show access denied screen if user has insufficient permissions
  if (accessDenied) {
    return <AccessDenied userEmail={userData?.profile?.email || userData?.user?.email || 'Necunoscut'} />
  }

  // Show loading screen if no location is selected yet
  if (!selectedLocation) {
    return <LoadingScreen message="Se încarcă locația..." />
  }

  return (
    <div className="h-screen bg-background w-full relative">
      {/* Main Content */}
      <div className="h-full flex overflow-hidden">
        {/* Sidebar with padding */}
        <div className="p-2">
          <NewSidebar 
            collapsed={sidebarCollapsed}
            currentView={currentView}
            onViewChange={handleViewChange}
            onToggle={handleSidebarToggle}
            currentLocation={selectedLocation}
            onLocationChange={handleLocationChange}
          />
        </div>
        
        {/* Content Area */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <Dashboard 
              currentView={currentView}
              currentLocation={selectedLocation}
            />
          </div>
        </main>
        
        {/* Floating Drawer with External Navigation */}
        {drawerOpen && (
          <div className="absolute top-0 right-0 z-30 h-full pt-18 p-2">
            {/* External Navigation - positioned at top */}
            {(drawerContent?.type === 'appointment' || drawerContent?.type === 'new-person' || drawerContent?.type === 'edit-person') && (
              <div className="absolute top-20 -left-10 z-40">
                <DrawerExternalNavigation
                  items={getExternalNavigationItems(drawerContent?.type)}
                  activeItem={getCurrentNavigationItem(drawerContent?.type)}
                  onItemChange={(id) => handleNavigationChange(id, drawerContent?.type)}
                  position="top"
                  className="flex-shrink-0"
                />
              </div>
            )}
            
            <Drawer 
              onClose={closeDrawer}
              position="side"
              size="md"
            >
              <DraftMainDrawer 
                open={drawerOpen}
                content={drawerContent}
                onClose={closeDrawer}
                externalNavigationState={externalNavigationState}
                onExternalNavigationChange={handleNavigationChange}
              />
            </Drawer>
          </div>
        )}

      </div>
      
      {/* Quick Actions Drawer */}
      <QuickActionsDrawer />
      
      {/* Sales Drawer */}
      <SalesDrawer />
      
      {/* Invoice Drawer */}
      <InvoiceDrawer />
      
      {/* Invoice Client Drawer */}
      <InvoiceClientDrawer />
    </div>
  )
}

function App() {
  return (
    <DrawerProvider>
        <AppContent />
    </DrawerProvider>
  )
}

export default App
