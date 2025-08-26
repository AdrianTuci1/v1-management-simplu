import userRolesInvoker from '../invoker/UserRolesInvoker.js'

class UserRolesRepository {
  constructor() {
    this.storageKey = 'user-roles'
  }

  async getUserRoles(userId = null, businessId = null) {
    try {
      const actualBusinessId = businessId || userRolesInvoker.getBusinessIdFromStorage()
      if (!actualBusinessId) {
        throw new Error('No business ID available')
      }

      const userRoles = await userRolesInvoker.getUserRoles(userId, actualBusinessId)
      
      // Store user roles in localStorage
      this.storeUserRoles(userRoles)
      
      return userRoles
    } catch (error) {
      console.error('Error in UserRolesRepository:', error)
      
      // Return cached data if available
      const cachedData = this.getStoredUserRoles()
      if (cachedData) {
        console.log('Using cached user roles')
        return cachedData
      }
      
      throw error
    }
  }

  storeUserRoles(userRoles) {
    localStorage.setItem(this.storageKey, JSON.stringify(userRoles))
    console.log('User roles stored in localStorage:', userRoles)
  }

  getStoredUserRoles() {
    const stored = localStorage.getItem(this.storageKey)
    return stored ? JSON.parse(stored) : null
  }

  clearStoredUserRoles() {
    localStorage.removeItem(this.storageKey)
  }

  // Get user's roles for locations
  getLocationRoles() {
    const userRoles = this.getStoredUserRoles()
    return userRoles?.locations || {}
  }

  // Check if user has access to a specific location
  canAccessLocation(locationId) {
    const locationRoles = this.getLocationRoles()
    const userRole = locationRoles[locationId]
    return userRole && userRole !== 'user'
  }

  // Get user's role for a specific location
  getUserRoleForLocation(locationId) {
    const locationRoles = this.getLocationRoles()
    return locationRoles[locationId] || null
  }

  // Query method for command pattern
  async query(params = {}) {
    const userId = params.userId || null
    const businessId = params.businessId || null
    return this.getUserRoles(userId, businessId)
  }
}

export default new UserRolesRepository()
