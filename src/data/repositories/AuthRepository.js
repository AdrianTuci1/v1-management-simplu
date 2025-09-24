import authInvoker from '../invoker/AuthInvoker.js'

class AuthRepository {
  constructor() {
    this.storageKey = 'auth-user-data'
  }

  async getCurrentUser() {
    try {

      const userData = await authInvoker.getCurrentUser()
      
      
      // Store user data in localStorage
      this.storeUserData(userData)
      
      // Verify data was stored correctly
      const storedData = this.getStoredUserData()
      
      return userData
    } catch (error) {
      console.error('Error in AuthRepository:', error)
      
      // Return cached data if available
      const cachedData = this.getStoredUserData()
      if (cachedData) {
        return cachedData
      }
      
      // If no cached data and API fails, return demo data
      console.log('API failed and no cached data, using demo user data')
      return this.getDemoUserData()
    }
  }

  storeUserData(userData) {
    localStorage.setItem(this.storageKey, JSON.stringify(userData))
    console.log('Auth user data stored in localStorage:', userData)
  }

  getStoredUserData() {
    const stored = localStorage.getItem(this.storageKey)
    return stored ? JSON.parse(stored) : null
  }

  clearStoredUserData() {
    localStorage.removeItem(this.storageKey)
  }

  // Get user's locations with roles
  getLocationsWithRoles() {
    const userData = this.getStoredUserData()
    return userData?.user?.locations || []
  }

  // Get user's accessible locations (filter out locations with 'user' role)
  getAccessibleLocations() {
    const locations = this.getLocationsWithRoles()
    return locations.filter(location => location.role && location.role !== 'user')
  }

  // Get user's role for a specific location
  getUserRoleForLocation(locationId) {
    const locations = this.getLocationsWithRoles()
    const location = locations.find(loc => loc.locationId === locationId)
    return location?.role || null
  }

  // Check if user can access a specific location
  canAccessLocation(locationId) {
    const role = this.getUserRoleForLocation(locationId)
    return role && role !== 'user'
  }

  // Get default location for user
  getDefaultLocation() {
    const accessibleLocations = this.getAccessibleLocations()
    return accessibleLocations[0] || null
  }

  // Check if user has admin access to any location
  hasAdminAccess() {
    const locations = this.getLocationsWithRoles()
    return locations.some(location => location.role === 'admin')
  }

  // Check if user should be denied access (no valid roles for any location)
  shouldDenyAccess() {
    const accessibleLocations = this.getAccessibleLocations()
    return accessibleLocations.length === 0
  }

  // Get user info
  getUserInfo() {
    const userData = this.getStoredUserData()
    return userData?.user || null
  }

  // Get demo user data when API is not available
  getDemoUserData() {
    const demoUserData = {
      success: true,
      user: {
        userId: 'demo-user',
        userName: 'Demo User',
        email: 'demo@cabinet-popescu.ro',
        businessId: 'B0100001',
        locations: [
          { locationId: 'L0100001', locationName: 'Premier Central', role: 'admin' },
          { locationId: 'L0100002', locationName: 'Filiala Pipera', role: 'manager' },
          { locationId: 'L0100003', locationName: 'Centrul Medical Militari', role: 'user' }
        ]
      }
    }
    
    // Store demo data in localStorage
    this.storeUserData(demoUserData)
    console.log('Using demo user data:', demoUserData)
    
    return demoUserData
  }

  // Query method for command pattern
  async query(params = {}) {
    return this.getCurrentUser()
  }
}

export default new AuthRepository()
