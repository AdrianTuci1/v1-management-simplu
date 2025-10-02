import { useState, useEffect, useCallback } from 'react'
import { externalServices } from '../services/externalServices.js'

// Stare partajată la nivel de modul pentru sincronizare între instanțe
let sharedConfigs = {}
const subscribers = new Set()

// Funcție pentru notificarea abonaților
const notifySubscribers = () => {
  subscribers.forEach(callback => callback(sharedConfigs))
}

export const useExternalApiConfig = () => {
  const [configs, setConfigs] = useState(sharedConfigs)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedLocationId, setSelectedLocationId] = useState('default')

  // Abonare la schimbările de stare partajată
  useEffect(() => {
    const handleStateChange = (newConfigs) => {
      setConfigs(newConfigs)
    }
    
    subscribers.add(handleStateChange)
    return () => subscribers.delete(handleStateChange)
  }, [])

  // Get configuration for a specific service
  const getServiceConfig = useCallback(async (serviceType, locationId = selectedLocationId) => {
    setLoading(true)
    setError(null)
    
    try {
      const config = await externalServices.getExternalApiConfig(serviceType, locationId)
      
      // Update shared state
      const configKey = `${serviceType}_${locationId}`
      sharedConfigs[configKey] = config
      notifySubscribers()
      
      return config
    } catch (err) {
      setError(err.message)
      console.error(`Error getting ${serviceType} configuration:`, err)
      return externalServices.getDefaultServiceConfig(serviceType)
    } finally {
      setLoading(false)
    }
  }, [selectedLocationId])

  // Save configuration for a specific service
  const saveServiceConfig = useCallback(async (serviceType, config, locationId = selectedLocationId) => {
    setLoading(true)
    setError(null)
    
    try {
      const savedConfig = await externalServices.saveExternalApiConfig(serviceType, config, locationId)
      
      // Update shared state
      const configKey = `${serviceType}_${locationId}`
      sharedConfigs[configKey] = savedConfig
      notifySubscribers()
      
      return savedConfig
    } catch (err) {
      setError(err.message)
      console.error(`Error saving ${serviceType} configuration:`, err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [selectedLocationId])

  // Get configuration from local state
  const getLocalServiceConfig = useCallback((serviceType, locationId = selectedLocationId) => {
    const configKey = `${serviceType}_${locationId}`
    return configs[configKey] || externalServices.getDefaultServiceConfig(serviceType)
  }, [configs, selectedLocationId])

  // Load all service configurations
  const loadAllConfigs = useCallback(async (locationId = selectedLocationId) => {
    setLoading(true)
    setError(null)
    
    try {
      const services = ['sms', 'email', 'voiceAgent', 'meta']
      const promises = services.map(service => getServiceConfig(service, locationId))
      await Promise.all(promises)
    } catch (err) {
      setError(err.message)
      console.error('Error loading all configurations:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedLocationId, getServiceConfig])

  // Check service authorization status
  const checkServiceStatus = useCallback(async (serviceName) => {
    try {
      return await externalServices.checkServiceStatus(serviceName)
    } catch (err) {
      console.error(`Error checking ${serviceName} status:`, err)
      return { authorized: false, error: err.message }
    }
  }, [])

  // Check all services status
  const checkAllServicesStatus = useCallback(async () => {
    try {
      return await externalServices.checkAllServicesStatus()
    } catch (err) {
      console.error('Error checking all services status:', err)
      return {}
    }
  }, [])

  // Handle service authorization
  const authorizeService = useCallback(async (serviceName) => {
    try {
      if (serviceName === 'gmail') {
        await externalServices.connectGmail()
      } else if (serviceName === 'meta') {
        await externalServices.connectMeta()
      } else if (serviceName === 'voiceAgent') {
        return await externalServices.createElevenLabsSession()
      }
      return null
    } catch (err) {
      console.error(`Error authorizing ${serviceName}:`, err)
      throw err
    }
  }, [])

  // Update service configuration locally (optimistic update)
  const updateLocalConfig = useCallback((serviceType, updates, locationId = selectedLocationId) => {
    const configKey = `${serviceType}_${locationId}`
    const currentConfig = configs[configKey] || externalServices.getDefaultServiceConfig(serviceType)
    const updatedConfig = { ...currentConfig, ...updates }
    
    sharedConfigs[configKey] = updatedConfig
    notifySubscribers()
    
    return updatedConfig
  }, [configs, selectedLocationId])

  // Reset configuration to default
  const resetServiceConfig = useCallback((serviceType, locationId = selectedLocationId) => {
    const defaultConfig = externalServices.getDefaultServiceConfig(serviceType)
    const configKey = `${serviceType}_${locationId}`
    
    sharedConfigs[configKey] = defaultConfig
    notifySubscribers()
    
    return defaultConfig
  }, [selectedLocationId])

  // Get available locations (placeholder - would come from business service)
  const getAvailableLocations = useCallback(() => {
    return externalServices.getAvailableLocations()
  }, [])

  // Load configurations when location changes
  useEffect(() => {
    loadAllConfigs(selectedLocationId)
  }, [selectedLocationId, loadAllConfigs])

  return {
    // State
    configs,
    loading,
    error,
    selectedLocationId,

    // Actions
    getServiceConfig,
    saveServiceConfig,
    getLocalServiceConfig,
    loadAllConfigs,
    checkServiceStatus,
    checkAllServicesStatus,
    authorizeService,
    updateLocalConfig,
    resetServiceConfig,
    setSelectedLocationId,
    getAvailableLocations,

    // Utilities
    getConfigByService: (serviceType) => getLocalServiceConfig(serviceType),
    isServiceEnabled: (serviceType) => {
      const config = getLocalServiceConfig(serviceType)
      return config?.enabled || false
    },
    getServiceTemplates: (serviceType) => {
      const config = getLocalServiceConfig(serviceType)
      return config?.templates || []
    }
  }
}

export default useExternalApiConfig
