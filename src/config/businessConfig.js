// Configurare Business - Permite încărcarea dinamică a iconițelor și numelui business-ului
import { FaTooth } from 'react-icons/fa'

// Map pentru iconițe disponibile
export const availableIcons = {
  'FaTooth': FaTooth
}

// Configurare implicită
const defaultConfig = {
  businessName: 'Cabinetul Dr. Popescu',
  businessIcon: 'FaTooth',
  businessType: 'stomatologie',
  address: 'Strada Florilor, Nr. 15, București, Sector 1',
  phone: '021 123 4567',
  email: 'contact@cabinet-popescu.ro',
  website: 'https://cabinet-popescu.ro',
  workingHours: 'Luni-Vineri 8:00-18:00',
  description: 'Cabinet stomatologic modern cu tehnologii de ultimă generație'
}

// Funcție pentru încărcarea configurației din variabile de mediu
export const loadBusinessConfig = () => {
  const config = { ...defaultConfig }
  
  // Încarcă din variabile de mediu dacă sunt disponibile
  if (import.meta.env.VITE_BUSINESS_NAME) {
    config.businessName = import.meta.env.VITE_BUSINESS_NAME
  }
  
  if (import.meta.env.VITE_BUSINESS_ICON) {
    config.businessIcon = import.meta.env.VITE_BUSINESS_ICON
  }
  
  if (import.meta.env.VITE_BUSINESS_TYPE) {
    config.businessType = import.meta.env.VITE_BUSINESS_TYPE
  }
  
  if (import.meta.env.VITE_BUSINESS_ADDRESS) {
    config.address = import.meta.env.VITE_BUSINESS_ADDRESS
  }
  
  if (import.meta.env.VITE_BUSINESS_PHONE) {
    config.phone = import.meta.env.VITE_BUSINESS_PHONE
  }
  
  if (import.meta.env.VITE_BUSINESS_EMAIL) {
    config.email = import.meta.env.VITE_BUSINESS_EMAIL
  }
  
  if (import.meta.env.VITE_BUSINESS_WEBSITE) {
    config.website = import.meta.env.VITE_BUSINESS_WEBSITE
  }
  
  if (import.meta.env.VITE_BUSINESS_HOURS) {
    config.workingHours = import.meta.env.VITE_BUSINESS_HOURS
  }
  
  if (import.meta.env.VITE_BUSINESS_DESCRIPTION) {
    config.description = import.meta.env.VITE_BUSINESS_DESCRIPTION
  }
  
  return config
}

// Funcție pentru obținerea iconiței dinamic
export const getBusinessIcon = (iconName = null) => {
  const config = loadBusinessConfig()
  const iconKey = iconName || config.businessIcon
  
  if (availableIcons[iconKey]) {
    return availableIcons[iconKey]
  }
  
  // Fallback la iconița implicită
  console.warn(`Iconița ${iconKey} nu a fost găsită, folosind FaTooth ca fallback`)
  return FaTooth
}

// Funcție pentru obținerea numelui business-ului
export const getBusinessName = () => {
  const config = loadBusinessConfig()
  return config.businessName
}

// Funcție pentru obținerea întregii configurații
export const getBusinessConfig = () => {
  return loadBusinessConfig()
}

// Hook pentru folosirea în componente React
export const useBusinessConfig = () => {
  const config = loadBusinessConfig()
  const BusinessIcon = getBusinessIcon()
  
  return {
    ...config,
    BusinessIcon
  }
}
