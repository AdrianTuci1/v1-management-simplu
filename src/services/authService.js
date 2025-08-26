import businessInfoRepository from '../data/repositories/BusinessInfoRepository.js'
import userRolesRepository from '../data/repositories/UserRolesRepository.js'
import { GetCommand } from '../data/commands/GetCommand.js'

// Mock data structure for Cognito Authorizer response
const mockCognitoData = {
  user: {
    id: 'user-123',
    email: 'admin@cabinet-popescu.ro',
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
      // First, get business info using command pattern
      const getBusinessInfoCommand = new GetCommand(businessInfoRepository, {})
      const businessInfo = await getBusinessInfoCommand.execute()
      
      // Then get user data (either from Cognito or demo mode)
      const userData = await this.getUserData()
      
      // Get user roles for locations
      let userRoles = null
      try {
        const getUserRolesCommand = new GetCommand(userRolesRepository, {})
        userRoles = await getUserRolesCommand.execute()
      } catch (error) {
        console.log('Could not fetch user roles, using demo data:', error)
        // In demo mode or if API fails, use demo roles
        userRoles = userData.locations ? { locations: userData.locations } : null
      }
      
      // Combine all data
      const combinedData = {
        ...userData,
        businessInfo,
        userRoles
      }
      
      return combinedData
    } catch (error) {
      console.error('Error initializing auth service:', error)
      throw error
    }
  }

  // Get user data based on authentication method
  async getUserData() {
    if (this.isDemoMode) {
      return this.getDemoUserData()
    } else {
      return this.getCognitoUserData()
    }
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

  // Process authenticated user data
  processUserData(userData, userRoles = null) {
    const businessInfo = businessInfoRepository.getStoredBusinessInfo()
    const locations = businessInfo?.locations || []
    
    // Use userRoles from API if available, otherwise fall back to userData.locations
    const locationRoles = userRoles?.locations || userData.locations || {}
    const accessibleLocations = locations.filter(location => {
      const userRole = locationRoles[location.id]
      return userRole && userRole !== 'user'
    })
    
    return {
      user: userData.user || userData.profile,
      accessibleLocations,
      userRoles: locationRoles,
      businessInfo
    }
  }

  // Get user's accessible locations based on their roles for each location
  getAccessibleLocations(userData) {
    const businessInfo = businessInfoRepository.getStoredBusinessInfo()
    const locations = businessInfo?.locations || []
    const userRoles = userData.locations || {}
    
    console.log('Getting accessible locations')
    console.log('Available locations:', locations)
    console.log('User roles per location:', userRoles)

    const accessibleLocations = locations.filter(location => {
      const userRoleForLocation = userRoles[location.id]
      console.log(`Location ${location.id} (${location.name}): user role for this location = ${userRoleForLocation}`)
      
      // User can access location if they have any role for it (not 'user' role which means no access)
      if (userRoleForLocation && userRoleForLocation !== 'user') {
        console.log(`Access granted for location ${location.id} with role ${userRoleForLocation}`)
        return true
      }
      
      console.log(`Access denied for location ${location.id} - no valid role`)
      return false
    })
    
    console.log('Final accessible locations:', accessibleLocations)
    return accessibleLocations
  }

  // Get default location for user
  getDefaultLocation(userData) {
    const accessibleLocations = this.getAccessibleLocations(userData)
    console.log('Getting default location from accessible locations:', accessibleLocations)
    
    // Return first accessible location
    const defaultLocation = accessibleLocations[0] || null
    console.log('Default location selected:', defaultLocation)
    return defaultLocation
  }

  // Check if user has admin access
  hasAdminAccess(userData) {
    const userRoles = userData.locations || {}
    return Object.values(userRoles).some(role => role === 'admin')
  }

  // Check if user should be denied access (no valid roles for any location)
  shouldDenyAccess(userData) {
    const userRoles = userData.locations || {}
    const hasValidRole = Object.values(userRoles).some(role => role && role !== 'user')
    return !hasValidRole
  }

  // Check if user can access a specific location
  canAccessLocation(userData, locationId) {
    const userRoles = userData.locations || {}
    const userRoleForLocation = userRoles[locationId]

    // User can access location if they have any role for it (not 'user' role which means no access)
    return userRoleForLocation && userRoleForLocation !== 'user'
  }

  // Get user's role for a specific location
  getUserRoleForLocation(userData, locationId) {
    const userRoles = userData.locations || {}
    return userRoles[locationId] || null
  }

  // Store user data in localStorage
  storeUserData(userData) {
    localStorage.setItem('auth-token', userData.access_token || userData.id_token)
    localStorage.setItem('user-email', userData.profile?.email || userData.user?.email)
    localStorage.setItem('cognito-data', JSON.stringify(userData))
  }

  // Clear user data from localStorage
  clearUserData() {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-email')
    localStorage.removeItem('cognito-data')
  }

  // Check if user is authenticated (has stored data)
  isAuthenticated() {
    const authToken = localStorage.getItem('auth-token')
    const savedCognitoData = localStorage.getItem('cognito-data')
    return !!(authToken || savedCognitoData)
  }
}

export default new AuthService()
