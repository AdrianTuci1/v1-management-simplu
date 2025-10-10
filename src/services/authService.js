import authRepository from '../data/repositories/AuthRepository.js'
import { GetCommand } from '../data/commands/GetCommand.js'
import { demoDataSeeder } from '../utils/demoDataSeeder.js'

// Mock data structure for Cognito Authorizer response
const mockCognitoData = {
  user: {
    id: 'user-123',
    email: 'admin@simplu.io',
    name: 'Dr. Popescu'
  },
  locations: {
    'L0100001': 'admin',    // Premier Central - utilizatorul are rol admin
    'L0100002': 'manager',  // Filiala Pipera - utilizatorul are rol manager
    'L0100003': 'user'      // Centrul Medical Militari - utilizatorul are rol user (fără acces)
  }
}

class AuthService {
  constructor() {
    this.isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  }

  // Initialize authentication and business data
  async initialize() {
    try {
      // In demo mode, skip API calls and use demo data
      if (this.isDemoMode) {
        console.log('Running in demo mode - using demo data instead of API calls')
        
        // Initialize demo data seeding
        try {
          console.log('Initializing demo data seeding...')
          await demoDataSeeder.seedIfEmpty()
          console.log('Demo data seeding completed')
        } catch (error) {
          console.error('Error during demo data seeding:', error)
          // Continue with demo mode even if seeding fails
        }
        
        // Get or create demo auth data with new format
        const authUserData = {
          success: true,
          user: {
            userId: 'demo-user',
            userName: 'Demo User',
            email: 'demo@cabinet-popescu.ro',
            businesses: [
              {
                businessId: 'B010001',
                businessName: 'Cabinetul Dr. Popescu',
                locations: [
                  { locationId: 'L0100001', locationName: 'Premier Central', role: 'admin' },
                  { locationId: 'L0100002', locationName: 'Filiala Pipera', role: 'manager' },
                  { locationId: 'L0100003', locationName: 'Centrul Medical Militari', role: 'user' }
                ]
              }
            ]
          }
        }
        
        // Store auth data
        authRepository.storeUserData(authUserData)
        console.log('✅ Auth data stored:', {
          userId: authUserData.user.userId,
          businessCount: authUserData.user.businesses.length
        })
        
        // If there's only one business, auto-select it
        if (authUserData.user.businesses.length === 1) {
          const businessId = authUserData.user.businesses[0].businessId
          authRepository.setSelectedBusiness(businessId)
          console.log('✅ Business auto-selected (only 1 available):', businessId)
        } else {
          console.log('⏸️  Multiple businesses found, user will need to select:', 
            authUserData.user.businesses.map(b => b.businessName))
        }
        
        return authUserData
      }
      
      // Get user data with businesses from auth API
      let authUserData = null
      try {
        const getAuthUserCommand = new GetCommand(authRepository, {})
        authUserData = await getAuthUserCommand.execute()
        
        // If there's only one business, auto-select it
        if (authUserData?.user?.businesses?.length === 1) {
          const businessId = authUserData.user.businesses[0].businessId
          authRepository.setSelectedBusiness(businessId)
          console.log('✅ Business auto-selected (only 1 available):', businessId)
        } else if (authUserData?.user?.businesses?.length > 1) {
          console.log('⏸️  Multiple businesses found, user will need to select:', 
            authUserData.user.businesses.map(b => b.businessName))
        }
      } catch (error) {
        console.log('Could not fetch auth user data:', error)
        // Return cached data if available
        authUserData = authRepository.getStoredUserData()
        if (!authUserData) {
          // Use demo data as fallback
          authUserData = authRepository.getDemoUserData()
        }
      }
      
      return authUserData
    } catch (error) {
      console.error('Error initializing auth service:', error)
      throw error
    }
  }

  // Get user data based on authentication method
  async getUserData() {
    if (this.isDemoMode) {
      return this.getDemoUserData()
    }
    
    // Check if user is authenticated via Google
    const authProvider = localStorage.getItem('auth-provider')
    if (authProvider === 'google') {
      return this.getGoogleUserData()
    }
    
    // Otherwise use Cognito
    return this.getCognitoUserData()
  }

  // Get Google user data from localStorage
  getGoogleUserData() {
    const savedCognitoData = localStorage.getItem('cognito-data')
    
    if (savedCognitoData) {
      try {
        const userData = JSON.parse(savedCognitoData)
        
        // Ensure we have locations data for Google auth users
        if (!userData.locations) {
          // Add default demo locations for Google auth users
          userData.locations = {
            'L0100001': 'admin',    // Premier Central - default admin role
            'L0100002': 'manager',  // Filiala Pipera
            'L0100003': 'user'      // Centrul Medical Militari
          }
        }
        
        return userData
      } catch (error) {
        console.error('Error parsing Google user data:', error)
        // If parsing fails, clear the data and redirect to login
        localStorage.removeItem('auth-token')
        localStorage.removeItem('user-email')
        localStorage.removeItem('cognito-data')
        localStorage.removeItem('auth-provider')
        return null
      }
    }
    
    return null
  }

  // Get demo user data from localStorage
  getDemoUserData() {
    const authToken = localStorage.getItem('auth-token')
    const savedCognitoData = localStorage.getItem('cognito-data')
    
    if (savedCognitoData) {
      return JSON.parse(savedCognitoData)
    }
    
    if (authToken) {
      // Create demo data structure
      const demoData = {
        id_token: authToken,
        access_token: authToken,
        refresh_token: 'demo-refresh-token',
        profile: {
          email: localStorage.getItem('user-email') || 'demo@cabinet-popescu.ro',
          name: 'Demo User'
        }
      }
      
      // Store for future use
      localStorage.setItem('cognito-data', JSON.stringify(demoData))
      return demoData
    }
    
    // Create default demo data if nothing exists
    const defaultDemoData = {
      id_token: 'demo-jwt-token',
      access_token: 'demo-jwt-token',
      refresh_token: 'demo-refresh-token',
      profile: {
        email: 'demo@cabinet-popescu.ro',
        name: 'Demo User'
      },
      locations: {
        'L0100001': 'admin',    // Premier Central - utilizatorul are rol admin
        'L0100002': 'manager',  // Filiala Pipera - utilizatorul are rol manager
        'L0100003': 'user'      // Centrul Medical Militari - utilizatorul are rol user (fără acces)
      }
    }
    
    // Store default demo data
    localStorage.setItem('auth-token', 'demo-jwt-token')
    localStorage.setItem('user-email', 'demo@cabinet-popescu.ro')
    localStorage.setItem('cognito-data', JSON.stringify(defaultDemoData))
    
    return defaultDemoData
  }

  // Get Cognito user data (for real authentication)
  async getCognitoUserData() {
    // This would be called when user is authenticated via Cognito
    // For now, return mock data
    return mockCognitoData
  }

  // Get businesses for authenticated user
  getBusinesses() {
    return authRepository.getBusinesses()
  }

  // Get selected business
  getSelectedBusiness() {
    return authRepository.getSelectedBusiness()
  }

  // Set selected business
  setSelectedBusiness(businessId) {
    authRepository.setSelectedBusiness(businessId)
  }

  // Check if business is selected
  isBusinessSelected() {
    return authRepository.isBusinessSelected()
  }

  // Get user's accessible locations from selected business
  getAccessibleLocations() {
    const accessibleLocations = authRepository.getAccessibleLocations()
    
    // Transform to include full location data
    return accessibleLocations.map(location => ({
      id: location.locationId,
      name: location.locationName,
      address: location.address || `Locația ${location.locationName}`,
      role: location.role,
      businessId: authRepository.getSelectedBusiness()?.businessId
    }))
  }

  // Get default location for user
  getDefaultLocation() {
    const accessibleLocations = this.getAccessibleLocations()
    console.log('Getting default location from accessible locations:', accessibleLocations)
    
    // Return first accessible location
    const defaultLocation = accessibleLocations[0] || null
    console.log('Default location selected:', defaultLocation)
    return defaultLocation
  }

  // Check if user has admin access
  hasAdminAccess() {
    return authRepository.hasAdminAccess()
  }

  // Check if user should be denied access (no valid roles for any location in selected business)
  shouldDenyAccess() {
    // First check if business is selected
    if (!authRepository.isBusinessSelected()) {
      // If no business selected but has businesses, don't deny access yet
      const businesses = authRepository.getBusinesses()
      if (businesses.length > 0) {
        return false
      }
      return true
    }
    
    return authRepository.shouldDenyAccess()
  }

  // Check if user can access a specific location
  canAccessLocation(locationId) {
    return authRepository.canAccessLocation(locationId)
  }

  // Get user's role for a specific location
  getUserRoleForLocation(locationId) {
    return authRepository.getUserRoleForLocation(locationId)
  }

  // Store user data in localStorage
  storeUserData(userData) {
    localStorage.setItem('auth-token', userData.id_token || userData.access_token)
    localStorage.setItem('user-email', userData.profile?.email || userData.user?.email)
    localStorage.setItem('cognito-data', JSON.stringify(userData))
  }

  // Clear user data from localStorage and IndexedDB
  async clearUserData() {
    // Clear old auth keys
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-email')
    localStorage.removeItem('cognito-data')
    
    // Clear new business selection keys
    localStorage.removeItem('auth-user-data')
    localStorage.removeItem('selected-business-id')
    localStorage.removeItem('selected-location')
    
    // Clear UI state
    localStorage.removeItem('dashboard-view')
    localStorage.removeItem('sidebar-collapsed')
    
    console.log('🧹 All user data cleared from localStorage')
    
    // Clear IndexedDB
    try {
      const { indexedDb } = await import('../data/infrastructure/db.js')
      await indexedDb.clearAllData()
    } catch (error) {
      console.error('Error clearing IndexedDB:', error)
    }
  }

  // Check if user is authenticated (has stored data)
  isAuthenticated() {
    const authToken = localStorage.getItem('auth-token')
    const savedCognitoData = localStorage.getItem('cognito-data')
    return !!(authToken || savedCognitoData)
  }
}

export default new AuthService()
