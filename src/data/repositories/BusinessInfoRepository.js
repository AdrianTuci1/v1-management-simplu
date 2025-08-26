import businessInfoInvoker from '../invoker/BusinessInfoInvoker.js'

class BusinessInfoRepository {
  constructor() {
    this.storageKey = 'business-info'
  }

  async getBusinessInfo(businessId = null) {
    try {
      const businessInfo = await businessInfoInvoker.getBusinessInfo(businessId)
      
      // Store essential data in localStorage
      this.storeBusinessInfo(businessInfo)
      
      return businessInfo
    } catch (error) {
      console.error('Error in BusinessInfoRepository:', error)
      
      // Return cached data if available
      const cachedData = this.getStoredBusinessInfo()
      if (cachedData) {
        console.log('Using cached business info')
        return cachedData
      }
      
      throw error
    }
  }

  storeBusinessInfo(businessInfo) {
    const essentialData = {
      companyName: businessInfo.companyName,
      businessType: businessInfo.businessType,
      businessId: businessInfo.businessId,
      locations: businessInfo.locations.map(location => ({
        id: location.id,
        name: location.name,
        address: location.address,
        active: location.active,
        timezone: location.timezone
      })),
      settings: businessInfo.settings,
      ownerEmail: businessInfo.ownerEmail,
      status: businessInfo.status
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(essentialData))
    console.log('Business info stored in localStorage:', essentialData)
  }

  getStoredBusinessInfo() {
    const stored = localStorage.getItem(this.storageKey)
    return stored ? JSON.parse(stored) : null
  }

  clearStoredBusinessInfo() {
    localStorage.removeItem(this.storageKey)
  }

  // Get locations for the business
  getLocations() {
    const businessInfo = this.getStoredBusinessInfo()
    return businessInfo?.locations || []
  }

  // Get company name
  getCompanyName() {
    const businessInfo = this.getStoredBusinessInfo()
    return businessInfo?.companyName || 'Unknown Company'
  }

  // Get business type
  getBusinessType() {
    const businessInfo = this.getStoredBusinessInfo()
    return businessInfo?.businessType || 'unknown'
  }

  // Query method for command pattern
  async query(params = {}) {
    const businessId = params.businessId || null
    return this.getBusinessInfo(businessId)
  }
}

export default new BusinessInfoRepository()
