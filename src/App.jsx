import { useState, useEffect } from 'react'
import { useAuth } from "react-oidc-context"
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { MainDrawer as MainDrawer } from './components/drawers'
import { Drawer } from './components/ui/drawer'
import Dashboard from './components/Dashboard'
import AuthScreen from './components/AuthScreen'
import LoadingScreen from './components/LoadingScreen'
import AccessDenied from './components/AccessDenied'
import QuickActionsDrawer from './components/drawers/QuickActionsDrawer'
import SalesDrawer from './components/drawers/SalesDrawer'
import authService from './services/authService'
import { DrawerProvider, useDrawer } from './contexts/DrawerContext'
import { connectWebSocket } from './data/infrastructure/websocketClient'

function AppContent() {
  const auth = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const { drawerOpen, drawerContent, closeDrawer } = useDrawer()

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
        // but only if we're not in the middle of an OAuth flow
        if (!auth.isLoading && auth.isAuthenticated) {
          cleanUrlParameters()
        }
      } catch (error) {
        console.error('Error initializing app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
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

  // Store auth data when user is authenticated via Cognito
  useEffect(() => {
    if (auth.user && !isDemoMode && !userData) {
      console.log('User authenticated, storing auth data and reinitializing...')
      const authData = {
        id_token: auth.user.id_token,
        access_token: auth.user.access_token,
        refresh_token: auth.user.refresh_token,
        profile: auth.user.profile
      }
      
      authService.storeUserData(authData)
      
      // Re-initialize app with new auth data
      const reinitialize = async () => {
        try {
          setIsLoading(true)
          
          // Load saved UI state again to preserve user's navigation
          const savedView = localStorage.getItem('dashboard-view')
          const savedSidebarState = localStorage.getItem('sidebar-collapsed')
          const savedLocation = localStorage.getItem('selected-location')
          
          console.log('Reinitializing with saved state:', { savedView, savedSidebarState, savedLocation })
          
          if (savedView) {
            console.log('Reinitializing with saved view:', savedView)
            setCurrentView(savedView)
          }
          if (savedSidebarState) setSidebarCollapsed(JSON.parse(savedSidebarState))
          
          const data = await authService.initialize()
          setUserData(data)
          
          if (authService.shouldDenyAccess(data)) {
            setAccessDenied(true)
            return
          }
          
          // Restore saved location or set default
          if (savedLocation) {
            setSelectedLocation(JSON.parse(savedLocation))
          } else {
            const defaultLocation = authService.getDefaultLocation(data)
            if (defaultLocation) {
              setSelectedLocation(defaultLocation)
              localStorage.setItem('selected-location', JSON.stringify(defaultLocation))
            }
          }
          
          // Clean up URL by removing authorization code and state parameters
          // AFTER successful re-initialization
          cleanUrlParameters()
        } catch (error) {
          console.error('Error reinitializing app:', error)
        } finally {
          setIsLoading(false)
        }
      }
      
      reinitialize()
    }
  }, [auth.isAuthenticated, auth.user, isDemoMode, userData])

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

  // Show loading screen while auth is loading
  if (auth.isLoading) {
    return <LoadingScreen message="Se încarcă autentificarea..." />
  }

  // Show error screen if auth error
  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>
  }

  // Show auth screen if not authenticated and not in demo mode
  if (!auth.isAuthenticated && !isDemoMode) {
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
    <div className="flex h-screen bg-background w-full flex-col">
        {/* Navbar */}
        <Navbar 
          currentView={currentView}
          currentLocation={selectedLocation}
        />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed}
          currentView={currentView}
          onViewChange={handleViewChange}
          onToggle={handleSidebarToggle}
          currentLocation={selectedLocation}
          onLocationChange={handleLocationChange}
        />

        
        {/* Content Area */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <Dashboard 
              currentView={currentView}
              currentLocation={selectedLocation}
            />
          </div>
          
          
          {/* Drawer as Side Panel */}
          {drawerOpen && (
            <Drawer 
              onClose={closeDrawer}
              position="side"
              size="md"
            >
              <MainDrawer 
                open={drawerOpen}
                content={drawerContent}
                onClose={closeDrawer}
              />
            </Drawer>
          )}

        </main>

      </div>
      
      {/* Quick Actions Drawer */}
      <QuickActionsDrawer />
      
      {/* Sales Drawer */}
      <SalesDrawer />
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
