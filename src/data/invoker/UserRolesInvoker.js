import { apiRequest } from '../infrastructure/apiClient.js'
import { healthRepository } from '../repositories/HealthRepository.js'

class UserRolesInvoker {
  constructor() {
    this.basePath = '/api/me'
  }

  // Check if we're using a demo token
  isDemoToken() {
    const authToken = localStorage.getItem('auth-token');
    return authToken === 'demo-jwt-token';
  }

  async getUserRoles(userId = null, businessId = null) {
    // Check if in demo mode (either from .env or from demo button)
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || this.isDemoToken();
    
    if (isDemoMode) {
      console.log('📊 Demo mode detected in UserRolesInvoker - skipping API call');
      throw new Error('Demo mode - no API call needed');
    }
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
      // Nu afișa erori dacă sistemul este offline
      const healthStatus = healthRepository.getCurrentStatus();
      const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
      
      if (!isDemoMode && healthStatus.lastCheck && !healthStatus.canMakeRequests) {
        // Sistemul este offline - nu afișa eroarea
        console.log('User roles request skipped - system is offline');
      } else {
        console.error('Error fetching user roles:', error);
      }
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
    // Try to get business ID from selected business
    const selectedBusinessId = localStorage.getItem('selected-business-id')
    return selectedBusinessId || 'B010001'
  }
}

export default new UserRolesInvoker()
