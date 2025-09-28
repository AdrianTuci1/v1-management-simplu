import { apiRequest } from '../infrastructure/apiClient.js'
import { healthRepository } from '../repositories/HealthRepository.js'

class AuthInvoker {
  constructor() {
    this.basePath = '/auth/me'
  }

  async getCurrentUser() {
    try {
      const businessId = this.getBusinessIdFromStorage()
      
      const response = await apiRequest('auth', `${this.basePath}/${businessId}`)

      
      return response
    } catch (error) {
      // Nu afișa erori dacă sistemul este offline
      const healthStatus = healthRepository.getCurrentStatus();
      const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
      
      if (!isDemoMode && healthStatus.lastCheck && !healthStatus.canMakeRequests) {
        // Sistemul este offline - nu afișa eroarea
        console.log('Auth request skipped - system is offline');
      } else {
        console.error('Error fetching current user data:', error);
      }
      throw error
    }
  }

  // Get user ID from Cognito auth data
  getUserIdFromAuth() {
    const savedCognitoData = localStorage.getItem('cognito-data')
    if (savedCognitoData) {
      const userData = JSON.parse(savedCognitoData)
      // Cognito returns user ID in profile.sub
      return userData.profile?.sub || userData.user?.id || null
    }
    return null
  }

  // Get business ID from storage or use default
  getBusinessIdFromStorage() {
    const businessInfo = localStorage.getItem('business-info')
    if (businessInfo) {
      const parsed = JSON.parse(businessInfo)
      return parsed.businessId || 'B0100001'
    }
    return 'B0100001'
  }

  // Get access token from Cognito data
  getAccessToken() {
    const savedCognitoData = localStorage.getItem('cognito-data')
    if (savedCognitoData) {
      const userData = JSON.parse(savedCognitoData)
      return userData.id_token || userData.access_token || null
    }
    return null
  }
}

export default new AuthInvoker()
