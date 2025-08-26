import { apiRequest } from '../infrastructure/apiClient.js'

class UserRolesInvoker {
  constructor() {
    this.basePath = '/api/me'
  }

  async getUserRoles(userId = null, businessId = null) {
    const actualUserId = userId || this.getUserIdFromAuth()
    const actualBusinessId = businessId || this.getBusinessIdFromStorage()
    
    if (!actualUserId) {
      throw new Error('No user ID available')
    }
    
    if (!actualBusinessId) {
      throw new Error('No business ID available')
    }
    
    const url = `${this.basePath}/${actualBusinessId}/${actualUserId}`
    
    try {
      const response = await apiRequest('user-roles', url)
      return response
    } catch (error) {
      console.error('Error fetching user roles:', error)
      throw error
    }
  }

  getUserIdFromAuth() {
    // Try to get user ID from Cognito auth data
    const savedCognitoData = localStorage.getItem('cognito-data')
    if (savedCognitoData) {
      const userData = JSON.parse(savedCognitoData)
      // Cognito returns user ID in profile.sub
      return userData.profile?.sub || userData.user?.id || null
    }
    return null
  }

  getBusinessIdFromStorage() {
    // Try to get business ID from business info or use default
    const businessInfo = localStorage.getItem('business-info')
    if (businessInfo) {
      const parsed = JSON.parse(businessInfo)
      return parsed.businessId || 'B0100001'
    }
    return 'B0100001'
  }
}

export default new UserRolesInvoker()
