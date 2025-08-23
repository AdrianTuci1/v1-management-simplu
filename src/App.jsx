import { useState, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { MainDrawer as Drawer } from './components/drawers'
import Dashboard from './components/Dashboard'
import AuthScreen from './components/AuthScreen'
import LoadingScreen from './components/LoadingScreen'
import AccessDenied from './components/AccessDenied'
import authService from './services/authService'
import { DrawerProvider, useDrawer } from './contexts/DrawerContext'

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cognitoData, setCognitoData] = useState(null)
  const [accessibleLocations, setAccessibleLocations] = useState([])
  const [accessDenied, setAccessDenied] = useState(false)
  const { drawerOpen, drawerContent, closeDrawer } = useDrawer()

  // Check if demo mode is enabled
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

  useCallback(() => {
  console.log('Demo mode enabled:', isDemoMode)
  console.log('VITE_DEMO_MODE value:', import.meta.env.VITE_DEMO_MODE)
  }, [isDemoMode])

  // Load state from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem('dashboard-view')
    const savedSidebarState = localStorage.getItem('sidebar-collapsed')
    const authToken = localStorage.getItem('auth-token')
    const savedLocation = localStorage.getItem('selected-location')
    const savedCognitoData = localStorage.getItem('cognito-data')
    
    if (savedView) {
      setCurrentView(savedView)
    }
    
    if (savedSidebarState) {
      setSidebarCollapsed(JSON.parse(savedSidebarState))
    }

    // Check authentication status
    if (authToken || isDemoMode) {
      setIsAuthenticated(true)
      
      // If demo mode, set demo user data
      if (isDemoMode && !authToken) {
        localStorage.setItem('auth-token', 'demo-jwt-token')
        localStorage.setItem('user-email', 'demo@cabinet-popescu.ro')
      }

      // Load cognito data if available
      if (savedCognitoData) {
        const cognitoData = JSON.parse(savedCognitoData)
        setCognitoData(cognitoData)
        
        // Check access permissions
        if (authService.shouldDenyAccess(cognitoData)) {
          setAccessDenied(true)
          return
        }

        // Set accessible locations
        const locations = authService.getAccessibleLocations(cognitoData)
        setAccessibleLocations(locations)

        // Set default location
        if (savedLocation) {
          setSelectedLocation(JSON.parse(savedLocation))
        } else {
          const defaultLocation = authService.getDefaultLocation(cognitoData)
          if (defaultLocation) {
            setSelectedLocation(defaultLocation)
            localStorage.setItem('selected-location', JSON.stringify(defaultLocation))
          }
        }
      } else if (isDemoMode) {
        // In demo mode, if no cognito data exists, load it
        handleAuthenticated()
      }
    }
  }, [isDemoMode])

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



  const handleAuthenticated = async () => {
    setIsAuthenticated(true)
    setIsLoading(true)
    
    try {
      console.log('Loading Cognito data...')
      // Get data from Cognito Authorizer
      const cognitoData = await authService.getCognitoData()
      console.log('Cognito data loaded:', cognitoData)
      setCognitoData(cognitoData)
      
      // Store cognito data
      localStorage.setItem('cognito-data', JSON.stringify(cognitoData))
      
      // Check access permissions
      if (authService.shouldDenyAccess(cognitoData)) {
        console.log('Access denied for user')
        setAccessDenied(true)
        setIsLoading(false)
        return
      }

      // Set accessible locations
      const locations = authService.getAccessibleLocations(cognitoData)
      console.log('Accessible locations:', locations)
      setAccessibleLocations(locations)

      // Set default location
      const defaultLocation = authService.getDefaultLocation(cognitoData)
      console.log('Default location:', defaultLocation)
      if (defaultLocation) {
        setSelectedLocation(defaultLocation)
        localStorage.setItem('selected-location', JSON.stringify(defaultLocation))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationChange = (location) => {
    setSelectedLocation(location)
    localStorage.setItem('selected-location', JSON.stringify(location))
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />
  }

  // Show loading screen while processing authentication
  if (isLoading) {
    return <LoadingScreen message="Se încarcă datele utilizatorului..." />
  }

  // Show access denied screen if user has insufficient permissions
  if (accessDenied) {
    return <AccessDenied userEmail={cognitoData?.user?.email || 'Necunoscut'} />
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
