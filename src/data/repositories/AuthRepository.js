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
      
      return userData
    } catch (error) {
      console.error('Error in AuthRepository:', error)
      
      // Return cached data if available
      const cachedData = this.getStoredUserData()
      if (cachedData) {
        console.log('Using cached auth user data')
        return cachedData
      }
      
      throw error
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

  // Query method for command pattern
  async query(params = {}) {
    return this.getCurrentUser()
  }
}

export default new AuthRepository()
