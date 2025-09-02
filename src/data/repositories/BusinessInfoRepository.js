import businessInfoInvoker from '../invoker/BusinessInfoInvoker.js'

class BusinessInfoRepository {
  constructor() {
    this.storageKey = 'business-info'
  }

  async getBusinessInfo(businessId = null) {
    try {
      const businessInfo = await businessInfoInvoker.getBusinessInfo(businessId)
      
      // Check if businessInfo is valid before storing
      if (!businessInfo) {
        console.warn('BusinessInfoInvoker returned null/undefined, using cached data if available')
        const cachedData = this.getStoredBusinessInfo()
        if (cachedData) {
          console.log('Using cached business info')
          return cachedData
        }
        throw new Error('No business info available from API or cache')
      }
      
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
    // Add null check and fallback for businessInfo
    if (!businessInfo) {
      console.warn('BusinessInfo is undefined, cannot store business info')
      return
    }

    const essentialData = {
      companyName: businessInfo.companyName || 'Unknown Company',
      businessType: businessInfo.businessType || 'unknown',
      businessId: businessInfo.businessId || 'B0100001',
      locations: (businessInfo.locations && Array.isArray(businessInfo.locations)) 
        ? businessInfo.locations.map(location => ({
            id: location.id || 'unknown',
            name: location.name || 'Unknown Location',
            address: location.address || 'No address provided',
            active: location.active !== undefined ? location.active : true,
            timezone: location.timezone || 'UTC'
          }))
        : [],
      settings: businessInfo.settings || {},
      ownerEmail: businessInfo.ownerEmail || 'no-email@unknown.com',
      status: businessInfo.status || 'unknown'
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
