import { apiRequest } from '../infrastructure/apiClient.js'
import { healthRepository } from '../repositories/HealthRepository.js'

class BusinessInfoInvoker {
  constructor() {
    this.basePath = '/business-info'
  }

  async getBusinessInfo(businessId = null) {
    const id = businessId || this.getBusinessIdFromUrl()
    const url = `${this.basePath}/${id}`
    
    try {
      const response = await apiRequest('/business-info', url)
      return response
    } catch (error) {
      // Nu afișa erori dacă sistemul este offline
      const healthStatus = healthRepository.getCurrentStatus();
      const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
      
      if (!isDemoMode && healthStatus.lastCheck && !healthStatus.canMakeRequests) {
        // Sistemul este offline - nu afișa eroarea
        console.log('Business info request skipped - system is offline');
      } else {
        console.error('Error fetching business info:', error);
      }
      throw error
    }
  }

  getBusinessIdFromUrl() {
    // // Try to get business ID from URL or use default
    // const urlParams = new URLSearchParams(window.location.search)
    const businessId = 'B0100001'
    return businessId
  }
}

export default new BusinessInfoInvoker()
