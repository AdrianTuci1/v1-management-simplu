import { apiRequest } from '../infrastructure/apiClient.js'
import { healthRepository } from '../repositories/HealthRepository.js'

class AuthInvoker {
  constructor() {
    this.basePath = '/auth/me'
  }

  // Check if we're using a demo token
  isDemoToken() {
    const authToken = localStorage.getItem('auth-token');
    return authToken === 'demo-jwt-token';
  }

  async getCurrentUser() {
    // Check if in demo mode (either from .env or from demo button)
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || this.isDemoToken();
    
    if (isDemoMode) {
      console.log('📊 Demo mode detected in AuthInvoker - skipping API call');
      throw new Error('Demo mode - no API call needed');
    }
    
    try {
      // Nu mai avem nevoie de businessId pentru auth - API-ul va returna toate business-urile utilizatorului
      const response = await apiRequest('auth', `${this.basePath}`)
      
      // Validate response format
      if (!response?.user?.businesses) {
        console.warn('Invalid auth response format, expected user.businesses array')
      }
      
      return response
    } catch (error) {
      // Nu afișa erori dacă sistemul este offline
      const healthStatus = healthRepository.getCurrentStatus();
      const isDemoModeCheck = import.meta.env.VITE_DEMO_MODE === 'true' || this.isDemoToken();
      
      if (!isDemoModeCheck && healthStatus.lastCheck && !healthStatus.canMakeRequests) {
        // Sistemul este offline - nu afișa eroarea
        console.log('Auth request skipped - system is offline');
      } else if (!isDemoModeCheck) {
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
