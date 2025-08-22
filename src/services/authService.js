// Mock data structure for Cognito Authorizer response
const mockCognitoData = {
  user: {
    id: 'user-123',
    email: 'admin@cabinet-popescu.ro',
    name: 'Dr. Popescu'
  },
  locations: {
    '1': 'admin',    // Sediu Central - utilizatorul are rol admin
    '2': 'manager',  // Filiala Pipera - utilizatorul are rol manager
    '3': 'user'      // Centrul Medical Militari - utilizatorul are rol user (fără acces)
  },
  availableLocations: [
    {
      id: 1,
      name: 'Sediu Central',
      address: 'Strada Florilor, Nr. 15',
      city: 'București, Sector 1',
      phone: '021 123 4567',
      email: 'central@cabinet-popescu.ro',
      schedule: 'Luni-Vineri 8:00-18:00',
      type: 'central'
    },
    {
      id: 2,
      name: 'Filiala Pipera',
      address: 'Bulevardul Pipera, Nr. 45',
      city: 'București, Sector 1',
      phone: '021 987 6543',
      email: 'pipera@cabinet-popescu.ro',
      schedule: 'Luni-Vineri 9:00-17:00',
      type: 'branch'
    },
    {
      id: 3,
      name: 'Centrul Medical Militari',
      address: 'Strada Militari, Nr. 123',
      city: 'București, Sector 6',
      phone: '021 555 1234',
      email: 'militari@cabinet-popescu.ro',
      schedule: 'Luni-Sâmbătă 7:00-19:00',
      type: 'branch'
    }
  ]
}

class AuthService {
  constructor() {
    this.isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  }

  // Simulate getting data from Cognito Authorizer
  async getCognitoData() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (this.isDemoMode) {
      return mockCognitoData
    }
    
    // In real app, this would be the actual Cognito Authorizer response
    // For now, return mock data
    return mockCognitoData
  }

  // Get user's accessible locations based on their roles for each location
  getAccessibleLocations(cognitoData) {
    const { locations, availableLocations } = cognitoData
    
    console.log('Getting accessible locations')
    console.log('Available locations:', availableLocations)
    console.log('User roles per location:', locations)

    const accessibleLocations = availableLocations.filter(location => {
      const userRoleForLocation = locations[location.id]
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
  getDefaultLocation(cognitoData) {
    const accessibleLocations = this.getAccessibleLocations(cognitoData)
    console.log('Getting default location from accessible locations:', accessibleLocations)
    
    // Return first accessible location
    const defaultLocation = accessibleLocations[0] || null
    console.log('Default location selected:', defaultLocation)
    return defaultLocation
  }

  // Check if user has admin access
  hasAdminAccess(cognitoData) {
    const userRole = cognitoData.user.role
    return userRole === 'admin' || userRole === 'manager'
  }

  // Check if user should be denied access (no valid roles for any location)
  shouldDenyAccess(cognitoData) {
    const { locations } = cognitoData
    const hasValidRole = Object.values(locations).some(role => role && role !== 'user')
    return !hasValidRole
  }

  // Check if user can access a specific location
  canAccessLocation(cognitoData, locationId) {
    const { locations } = cognitoData
    const userRoleForLocation = locations[locationId]

    // User can access location if they have any role for it (not 'user' role which means no access)
    return userRoleForLocation && userRoleForLocation !== 'user'
  }

  // Get user's role for a specific location
  getUserRoleForLocation(cognitoData, locationId) {
    const { locations } = cognitoData
    return locations[locationId] || null
  }
}

export default new AuthService()
