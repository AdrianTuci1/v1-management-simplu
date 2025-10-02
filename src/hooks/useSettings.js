import { useState, useEffect, useCallback } from 'react'
import { settingsService } from '../services/settingsService.js'
import { indexedDb } from '../data/infrastructure/db.js'
import { onResourceMessage } from '../data/infrastructure/websocketClient.js'

// Stare partajată la nivel de modul pentru sincronizare între instanțe
let sharedSettings = []
let sharedWorkingHours = null
let sharedSettingsCount = 0
const subscribers = new Set()

// Funcție pentru notificarea abonaților
const notifySubscribers = () => {
  subscribers.forEach(callback => callback(sharedSettings, sharedWorkingHours, sharedSettingsCount))
}

export const useSettings = () => {
  const [settings, setSettings] = useState(sharedSettings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [workingHours, setWorkingHours] = useState(sharedWorkingHours)
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [settingsCount, setSettingsCount] = useState(sharedSettingsCount)

  // Abonare la schimbările de stare partajată
  useEffect(() => {
    const handleStateChange = (newSettings, newWorkingHours, newCount) => {
      setSettings(newSettings)
      setWorkingHours(newWorkingHours)
      setSettingsCount(newCount)
    }
    
    subscribers.add(handleStateChange)
    return () => subscribers.delete(handleStateChange)
  }, [])

  // WebSocket handling pentru settings
  useEffect(() => {
    const handler = async (message) => {
      const { type, data, resourceType } = message
      if (resourceType !== 'settings') return
      
      const operation = type?.replace('resource_', '') || type
      const settingId = data?.id || data?.resourceId
      if (!settingId) return
      
      if (operation === 'created' || operation === 'create') {
        const transformedSetting = settingsService.transformSettingForUI({ ...data, id: settingId, resourceId: settingId })
        const idx = sharedSettings.findIndex(s => s.id === settingId || s.resourceId === settingId)
        if (idx >= 0) {
          sharedSettings[idx] = { ...transformedSetting, _isOptimistic: false }
        } else {
          sharedSettings = [{ ...transformedSetting, _isOptimistic: false }, ...sharedSettings]
        }
        
        // Actualizează working hours dacă este cazul
        if (transformedSetting.settingType === 'working-hours') {
          sharedWorkingHours = { ...transformedSetting, _isOptimistic: false }
        }
        
        sharedSettingsCount = sharedSettings.length
        notifySubscribers()
      } else if (operation === 'updated' || operation === 'update') {
        const idx = sharedSettings.findIndex(s => s.id === settingId || s.resourceId === settingId)
        if (idx >= 0) {
          const transformedSetting = settingsService.transformSettingForUI({ ...data, id: settingId, resourceId: settingId })
          sharedSettings[idx] = { ...transformedSetting, _isOptimistic: false }
          
          // Actualizează working hours dacă este cazul
          if (transformedSetting.settingType === 'working-hours') {
            sharedWorkingHours = { ...transformedSetting, _isOptimistic: false }
          }
          
          notifySubscribers()
        }
      } else if (operation === 'deleted' || operation === 'delete') {
        sharedSettings = sharedSettings.filter(s => (s.id !== settingId && s.resourceId !== settingId))
        
        // Verifică dacă working hours a fost șters
        if (sharedWorkingHours && (sharedWorkingHours.id === settingId || sharedWorkingHours.resourceId === settingId)) {
          sharedWorkingHours = null
        }
        
        sharedSettingsCount = sharedSettings.length
        notifySubscribers()
      }
    }

    // Abonează-te la mesajele WebSocket pentru settings
    const unsub = onResourceMessage('settings', handler)

    return () => {
      unsub()
    }
  }, [])

  // Încarcă toate setările
  const loadSettings = useCallback(async (customFilters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const allFilters = { ...filters, ...customFilters }
      const settingsData = await settingsService.getSettings(allFilters)
      
      // Aplică filtrele și sortarea
      let filteredSettings = settingsData
      if (allFilters.settingType) {
        filteredSettings = filteredSettings.filter(s => s.settingType === allFilters.settingType)
      }
      if (allFilters.isActive !== undefined) {
        filteredSettings = filteredSettings.filter(s => s.isActive === allFilters.isActive)
      }
      
      // Sortare
      filteredSettings.sort((a, b) => {
        const aVal = a[sortBy] || ''
        const bVal = b[sortBy] || ''
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
      
      // Actualizează starea partajată
      sharedSettings = filteredSettings
      sharedSettingsCount = filteredSettings.length
      
      // Actualizează working hours dacă există
      const workingHoursSetting = filteredSettings.find(s => s.settingType === 'working-hours')
      sharedWorkingHours = workingHoursSetting || null
      
      notifySubscribers()
    } catch (err) {
      // Încearcă să încarce din cache local dacă API-ul eșuează
      try {
        console.warn('API failed, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('settings')
        
        // Aplică filtrele pe datele din cache
        let filteredSettings = cachedData
        
        if (allFilters.settingType) {
          filteredSettings = filteredSettings.filter(s => s.settingType === allFilters.settingType)
        }
        if (allFilters.isActive !== undefined) {
          filteredSettings = filteredSettings.filter(s => s.isActive === allFilters.isActive)
        }
        
        // Sortare
        filteredSettings.sort((a, b) => {
          const aVal = a[sortBy] || ''
          const bVal = b[sortBy] || ''
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        })
        
        // Actualizează starea partajată
        sharedSettings = filteredSettings
        sharedSettingsCount = filteredSettings.length
        
        // Actualizează working hours dacă există
        const workingHoursSetting = filteredSettings.find(s => s.settingType === 'working-hours')
        sharedWorkingHours = workingHoursSetting || null
        
        notifySubscribers()
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error loading settings:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder])

  // Încarcă working hours
  const loadWorkingHours = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const workingHoursData = await settingsService.getWorkingHours()
      sharedWorkingHours = workingHoursData
      notifySubscribers()
      return workingHoursData
    } catch (err) {
      setError(err.message)
      console.error('Error loading working hours:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Obține o setare după ID din lista locală
  const getSettingById = useCallback((id) => {
    return settings.find(setting => setting.id === id || setting.resourceId === id) || null
  }, [settings])

  // Adaugă o setare nouă
  const addSetting = useCallback(async (settingData) => {
    setLoading(true)
    setError(null)
    
    try {
      const newSetting = await settingsService.addSetting(settingData)
      const idx = sharedSettings.findIndex(s => s.id === newSetting.id || s.resourceId === newSetting.resourceId)
      if (idx >= 0) {
        sharedSettings[idx] = { ...newSetting, _isOptimistic: false }
      } else {
        sharedSettings = [newSetting, ...sharedSettings]
      }
      
      // Actualizează working hours dacă este cazul
      if (newSetting.settingType === 'working-hours') {
        sharedWorkingHours = { ...newSetting, _isOptimistic: false }
      }
      
      sharedSettingsCount = sharedSettings.length
      notifySubscribers()
      return newSetting
    } catch (err) {
      setError(err.message)
      console.error('Error adding setting:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizează o setare
  const updateSetting = useCallback(async (id, settingData) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedSetting = await settingsService.updateSetting(id, settingData)
      const existingIndex = sharedSettings.findIndex(s => s.id === id || s.resourceId === id)
      if (existingIndex >= 0) {
        sharedSettings[existingIndex] = { ...updatedSetting, _isOptimistic: false }
      }
      
      // Actualizează working hours dacă este cazul
      if (updatedSetting.settingType === 'working-hours') {
        sharedWorkingHours = { ...updatedSetting, _isOptimistic: false }
      }
      
      notifySubscribers()
      return updatedSetting
    } catch (err) {
      setError(err.message)
      console.error('Error updating setting:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Șterge o setare
  const deleteSetting = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      await settingsService.deleteSetting(id)
      sharedSettings = sharedSettings.filter(s => (s.id !== id && s.resourceId !== id))
      
      // Verifică dacă working hours a fost șters
      if (sharedWorkingHours && (sharedWorkingHours.id === id || sharedWorkingHours.resourceId === id)) {
        sharedWorkingHours = null
      }
      
      sharedSettingsCount = sharedSettings.length
      notifySubscribers()
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error deleting setting:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Salvează working hours
  const saveWorkingHours = useCallback(async (workingHoursData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await settingsService.saveWorkingHours(workingHoursData)
      
      // Actualizează working hours în starea partajată
      sharedWorkingHours = { ...result, _isOptimistic: false }
      
      // Actualizează sau adaugă în lista de settings
      const existingIndex = sharedSettings.findIndex(s => s.id === result.id || s.resourceId === result.id)
      if (existingIndex >= 0) {
        sharedSettings[existingIndex] = { ...result, _isOptimistic: false }
      } else {
        sharedSettings = [result, ...sharedSettings]
        sharedSettingsCount = sharedSettings.length
      }
      
      notifySubscribers()
      return result
    } catch (err) {
      setError(err.message)
      console.error('Error saving working hours:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Căutare setări
  const searchSettings = useCallback(async (query, searchFilters = {}, limit = 50) => {
    setLoading(true)
    setError(null)
    
    try {
      const searchResults = await settingsService.searchSettings(query, { ...searchFilters, limit })
      
      // Actualizează starea partajată
      sharedSettings = searchResults
      sharedSettingsCount = searchResults.length
      notifySubscribers()
      
      return searchResults
    } catch (err) {
      // Încearcă să încarce din cache local dacă API-ul eșuează
      try {
        console.warn('API failed, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('settings')
        
        const searchTermLower = query.toLowerCase()
        const filteredData = cachedData.filter(setting => 
          setting.name?.toLowerCase().includes(searchTermLower) ||
          setting.settingType?.toLowerCase().includes(searchTermLower) ||
          (setting.description && setting.description.toLowerCase().includes(searchTermLower))
        ).slice(0, limit)
        
        // Actualizează starea partajată
        sharedSettings = filteredData
        sharedSettingsCount = filteredData.length
        notifySubscribers()
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        return filteredData
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error searching settings:', err)
        return []
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Filtrare locală
  const filterSettings = useCallback((filterOptions) => {
    setFilters(prev => ({ ...prev, ...filterOptions }))
  }, [])

  // Sortare
  const sortSettings = useCallback((newSortBy, newSortOrder = 'asc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }, [])

  // Reset filtre
  const resetFilters = useCallback(() => {
    setFilters({})
    setSortBy('name')
    setSortOrder('asc')
  }, [])

  // Încarcă setările la prima renderizare
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    // State
    settings,
    workingHours,
    loading,
    error,
    settingsCount,
    filters,
    sortBy,
    sortOrder,

    // Actions
    loadSettings,
    loadWorkingHours,
    getSettingById,
    addSetting,
    updateSetting,
    deleteSetting,
    saveWorkingHours,
    searchSettings,
    filterSettings,
    sortSettings,
    resetFilters,

    // Utilitare
    getActiveSettings: () => settings.filter(s => s.isActive),
    getInactiveSettings: () => settings.filter(s => !s.isActive),
    getSettingsByType: (settingType) => 
      settings.filter(s => s.settingType === settingType)
  }
}
