import { apiRequest } from '../infrastructure/apiClient.js'

class BusinessInfoInvoker {
  constructor() {
    this.basePath = '/api/business-info'
  }

  async getBusinessInfo(businessId = null) {
    const id = businessId || this.getBusinessIdFromUrl()
    const url = `${this.basePath}/${id}`
    
    try {
      const response = await apiRequest('business-info', url)
      return response
    } catch (error) {
      console.error('Error fetching business info:', error)
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
