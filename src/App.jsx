import { useState, useEffect } from 'react'
import { useAuth } from "react-oidc-context"
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { MainDrawer as Drawer } from './components/drawers'
import Dashboard from './components/Dashboard'
import AuthScreen from './components/AuthScreen'
import LoadingScreen from './components/LoadingScreen'
import AccessDenied from './components/AccessDenied'
import AIAssistantComponent from './components/AIAssistant'
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

  // Initialize app data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true)
        
        // Load saved UI state
        const savedView = localStorage.getItem('dashboard-view')
        const savedSidebarState = localStorage.getItem('sidebar-collapsed')
        const savedLocation = localStorage.getItem('selected-location')
        
        if (savedView) setCurrentView(savedView)
        if (savedSidebarState) setSidebarCollapsed(JSON.parse(savedSidebarState))
        
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
    if (auth.isAuthenticated && auth.user && !isDemoMode) {
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
          const data = await authService.initialize()
          setUserData(data)
          
          if (authService.shouldDenyAccess(data)) {
            setAccessDenied(true)
            return
          }
          
          const defaultLocation = authService.getDefaultLocation(data)
          if (defaultLocation) {
            setSelectedLocation(defaultLocation)
            localStorage.setItem('selected-location', JSON.stringify(defaultLocation))
          }
        } catch (error) {
          console.error('Error reinitializing app:', error)
        } finally {
          setIsLoading(false)
        }
      }
      
      reinitialize()
    }
  }, [auth.isAuthenticated, auth.user, isDemoMode])

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dashboard-view', currentView)
  }, [currentView])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  const handleViewChange = (view) => {
    setCurrentView(view)
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
        <main className="flex-1 overflow-auto p-6">
          <Dashboard 
            currentView={currentView}
            currentLocation={selectedLocation}
          />
        </main>

        {/* Drawer */}
        <Drawer 
          open={drawerOpen}
          content={drawerContent}
          onClose={closeDrawer}
        />
      </div>
      
      {/* AI Assistant */}
      <AIAssistantComponent />
      
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
