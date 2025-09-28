import businessInfoInvoker from '../invoker/BusinessInfoInvoker.js'
import { healthRepository } from './HealthRepository.js'

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
        
        // If no cached data and no API data, return demo data
        console.log('No business info available from API or cache, using demo data')
        return this.getDemoBusinessInfo()
      }
      
      // Store essential data in localStorage
      this.storeBusinessInfo(businessInfo)
      
      return businessInfo
    } catch (error) {
      // Nu afișa erori dacă sistemul este offline
      const healthStatus = healthRepository.getCurrentStatus();
      const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
      
      if (!isDemoMode && healthStatus.lastCheck && !healthStatus.canMakeRequests) {
        // Sistemul este offline - nu afișa eroarea
        console.log('Business info request skipped - system is offline');
      } else {
        console.error('Error in BusinessInfoRepository:', error);
      }
      
      // Return cached data if available
      const cachedData = this.getStoredBusinessInfo()
      if (cachedData) {
        console.log('Using cached business info')
        return cachedData
      }
      
      // If no cached data and API fails, return demo data
      console.log('API failed and no cached data, using demo data')
      return this.getDemoBusinessInfo()
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

  // Get demo business info when API is not available
  getDemoBusinessInfo() {
    const demoBusinessInfo = {
      businessId: 'B0100001',
      businessName: 'Cabinetul Dr. Popescu',
      companyName: 'Cabinetul Dr. Popescu',
      businessType: 'medical',
      ownerEmail: 'contact@cabinet-popescu.ro',
      status: 'active',
      locations: [
        {
          id: 'L0100001',
          name: 'Premier Central',
          address: 'Strada Florilor, Nr. 15, București, Sector 1',
          active: true,
          timezone: 'Europe/Bucharest'
        },
        {
          id: 'L0100002',
          name: 'Filiala Pipera',
          address: 'Bulevardul Pipera, Nr. 45, București, Sector 1',
          active: true,
          timezone: 'Europe/Bucharest'
        },
        {
          id: 'L0100003',
          name: 'Centrul Medical Militari',
          address: 'Strada Militari, Nr. 123, București, Sector 6',
          active: true,
          timezone: 'Europe/Bucharest'
        }
      ],
      settings: {}
    }
    
    // Store demo data in localStorage
    this.storeBusinessInfo(demoBusinessInfo)
    console.log('Using demo business info:', demoBusinessInfo)
    
    return demoBusinessInfo
  }

  // Query method for command pattern
  async query(params = {}) {
    const businessId = params.businessId || null
    return this.getBusinessInfo(businessId)
  }
}

export default new BusinessInfoRepository()
