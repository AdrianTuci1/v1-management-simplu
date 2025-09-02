import { useState, useEffect, useCallback } from 'react'
import treatmentService from '../services/treatmentService.js'
import treatmentManager from '../business/treatmentManager.js'
import { indexedDb } from '../data/infrastructure/db.js'
import { populateTestData, checkCacheStatus } from '../utils/treatmentUtils.js'
import { generateTempId } from '../lib/utils.js'
import { onResourceMessage } from '../data/infrastructure/websocketClient.js'

// Stare partajată la nivel de modul pentru sincronizare între instanțe
let sharedTreatments = []
let sharedStats = null
const subscribers = new Set()

// Funcție pentru notificarea abonaților
const notifySubscribers = () => {
  subscribers.forEach(callback => callback())
}

export const useTreatments = () => {
  const [treatments, setTreatments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('treatmentType')
  const [sortOrder, setSortOrder] = useState('asc')

  // Cache pentru numărul de tratamente
  const [treatmentCount, setTreatmentCount] = useState(0)



  // Funcție pentru actualizarea stării locale din shared state
  const updateLocalState = useCallback(() => {
    setTreatments([...sharedTreatments])
    setStats(sharedStats)
    setTreatmentCount(sharedTreatments.length)
  }, [])

  // Înregistrare ca subscriber
  useEffect(() => {
    subscribers.add(updateLocalState)
    updateLocalState() // Inițializare cu starea curentă
    
    return () => {
      subscribers.delete(updateLocalState)
    }
  }, [updateLocalState])

  // Handler pentru mesaje WebSocket
  useEffect(() => {
    const handleResourceMessage = async (message) => {
      const { type, data, resourceType } = message
      
      if (resourceType !== 'treatment') return
      
      const operation = type?.replace('resource_', '') || 'unknown'
      const treatmentId = data?.id || data?.resourceId
      
      if (!treatmentId) return
      
      try {
        if (operation === 'created') {
          // Înlocuiește tratamentul optimist cu datele reale
          const ui = treatmentManager.transformTreatmentForUI({ ...data, id: treatmentId, resourceId: treatmentId })
          
          // Caută în outbox pentru a găsi operația optimistă
          const outboxEntry = await indexedDb.outboxFindByTempId(treatmentId)
          
          if (outboxEntry) {
            const optimisticIndex = sharedTreatments.findIndex(t => t._tempId === outboxEntry.tempId)
            if (optimisticIndex >= 0) {
              sharedTreatments[optimisticIndex] = { ...ui, _isOptimistic: false }
            }
            await indexedDb.outboxDelete(outboxEntry.id)
          } else {
            // Dacă nu găsim în outbox, încercăm să găsim după euristică
            const optimisticIndex = sharedTreatments.findIndex(t => 
              t._isOptimistic && 
              t.treatmentType === data.treatmentType &&
              t.category === data.category
            )
            if (optimisticIndex >= 0) {
              sharedTreatments[optimisticIndex] = { ...ui, _isOptimistic: false }
            } else {
              // Adaugă ca nou dacă nu există
              sharedTreatments = [ui, ...sharedTreatments]
            }
          }
          
        } else if (operation === 'updated') {
          // Dezactivează flag-ul optimistic
          const ui = treatmentManager.transformTreatmentForUI({ ...data, id: treatmentId, resourceId: treatmentId })
          const existingIndex = sharedTreatments.findIndex(t => 
            t.id === treatmentId || t.resourceId === treatmentId
          )
          if (existingIndex >= 0) {
            sharedTreatments[existingIndex] = { ...ui, _isOptimistic: false }
          }
          
        } else if (operation === 'deleted') {
          // Elimină tratamentul din lista locală
          sharedTreatments = sharedTreatments.filter(t => {
            const matches = t.id === treatmentId || t.resourceId === treatmentId
            return !matches
          })
        }
        
        notifySubscribers()
      } catch (error) {
        console.error('Error handling treatment WebSocket message:', error)
      }
    }

    // Înregistrează handler-ul pentru mesajele de tratamente
    const unsubPlural = onResourceMessage('treatments', handleResourceMessage)
    const unsubSingular = onResourceMessage('treatment', handleResourceMessage)
    
    return () => {
      unsubPlural()
      unsubSingular()
    }
  }, [])

  // Încarcă toate tratamentele
  const loadTreatments = useCallback(async (customFilters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const allFilters = { ...filters, ...customFilters }
      console.log('loadTreatments - calling treatmentService.getTreatments with filters:', allFilters)
      const treatmentsData = await treatmentService.getTreatments(allFilters)
      console.log('loadTreatments - treatmentService.getTreatments returned:', treatmentsData)
      
      // Aplică filtrele și sortarea
      let filteredTreatments = treatmentManager.filterTreatments(treatmentsData, allFilters)
      filteredTreatments = treatmentManager.sortTreatments(filteredTreatments, sortBy, sortOrder)
      
      // Actualizează shared state și notifică abonații
      sharedTreatments = filteredTreatments
      setTreatments(filteredTreatments)
      setTreatmentCount(filteredTreatments.length)
      notifySubscribers()
    } catch (err) {
      // Încearcă să încarce din cache local dacă API-ul eșuează
      try {
        console.warn('API failed, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('treatments')
        
        // Dacă cache-ul este gol, populează cu date de test
        if (cachedData.length === 0) {
          console.log('Cache is empty, populating with test data...')
          await populateTestData()
          const testData = await indexedDb.getAll('treatments')
          sharedTreatments = testData
          setTreatments(testData)
          setTreatmentCount(testData.length)
          setError('Conectare la server eșuată. Se afișează datele de test din cache local.')
          notifySubscribers()
          return testData
        }
        
        sharedTreatments = cachedData
        setTreatments(cachedData)
        setTreatmentCount(cachedData.length)
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        notifySubscribers()
        return cachedData
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error loading treatments:', err)
        return []
      }
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder])

  // Obține un tratament după ID din lista locală
  const getTreatmentById = useCallback((id) => {
    return treatments.find(treatment => treatment.id === id) || null
  }, [treatments])

  // Adaugă un tratament nou cu optimistic update
  const addTreatment = useCallback(async (treatmentData) => {
    setLoading(true)
    setError(null)
    
    // Generează ID temporar pentru optimistic update
    const tempId = generateTempId('treatment')
    
    try {
      const optimisticTreatment = {
        ...treatmentManager.transformTreatmentForUI(treatmentData),
        _tempId: tempId,
        _isOptimistic: true,
        id: tempId,
        resourceId: tempId
      }
      
      // Adaugă în shared state optimist
      sharedTreatments = [optimisticTreatment, ...sharedTreatments]
      setTreatments(sharedTreatments)
      setTreatmentCount(sharedTreatments.length)
      notifySubscribers()
      
      // Trimitere la server
      const newTreatment = await treatmentService.addTreatment(treatmentData)
      
      // Dacă API-ul a returnat date reale, înlocuiește optimistul
      if (newTreatment && newTreatment.id) {
        const realTreatment = treatmentManager.transformTreatmentForUI(newTreatment)
        const optimisticIndex = sharedTreatments.findIndex(t => t._tempId === tempId)
        if (optimisticIndex >= 0) {
          sharedTreatments[optimisticIndex] = { ...realTreatment, _isOptimistic: false }
          setTreatments(sharedTreatments)
          notifySubscribers()
        }
      }
      
      return newTreatment
    } catch (err) {
      // Rollback în caz de eroare
      sharedTreatments = sharedTreatments.filter(t => t._tempId !== tempId)
      setTreatments(sharedTreatments)
      setTreatmentCount(sharedTreatments.length)
      notifySubscribers()
      
      setError(err.message)
      console.error('Error adding treatment:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizează un tratament cu optimistic update
  const updateTreatment = useCallback(async (id, treatmentData) => {
    setLoading(true)
    setError(null)
    
    try {
      // Găsește tratamentul existent
      const existingIndex = sharedTreatments.findIndex(t => t.id === id || t.resourceId === id)
      if (existingIndex === -1) {
        throw new Error('Tratamentul nu a fost găsit')
      }
      
      const existingTreatment = sharedTreatments[existingIndex]
      
      // Creează versiunea optimistă
      const optimisticTreatment = {
        ...treatmentManager.transformTreatmentForUI(treatmentData),
        _isOptimistic: true,
        id: existingTreatment.id,
        resourceId: existingTreatment.resourceId
      }
      
      // Actualizează în shared state optimist
      sharedTreatments[existingIndex] = optimisticTreatment
      setTreatments(sharedTreatments)
      notifySubscribers()
      
      // Trimitere la server
      const updatedTreatment = await treatmentService.updateTreatment(id, treatmentData)
      
      // Dacă API-ul a returnat date reale, dezactivează optimistic
      if (updatedTreatment) {
        const realTreatment = treatmentManager.transformTreatmentForUI(updatedTreatment)
        sharedTreatments[existingIndex] = { ...realTreatment, _isOptimistic: false }
        setTreatments(sharedTreatments)
        notifySubscribers()
      }
      
      return updatedTreatment
    } catch (err) {
      setError(err.message)
      console.error('Error updating treatment:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Șterge un tratament cu optimistic update
  const deleteTreatment = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      // Găsește tratamentul existent
      const existingIndex = sharedTreatments.findIndex(t => t.id === id || t.resourceId === id)
      if (existingIndex === -1) {
        throw new Error('Tratamentul nu a fost găsit')
      }
      
      const existingTreatment = sharedTreatments[existingIndex]
      
      // Marchează pentru ștergere optimistă
      const deletingTreatment = {
        ...existingTreatment,
        _isOptimistic: true,
        _isDeleting: true
      }
      
      // Actualizează în shared state
      sharedTreatments[existingIndex] = deletingTreatment
      setTreatments(sharedTreatments)
      notifySubscribers()
      
      // Trimitere la server
      await treatmentService.deleteTreatment(id)
      
      // Elimină din lista locală
      sharedTreatments = sharedTreatments.filter(t => t.id !== id && t.resourceId !== id)
      setTreatments(sharedTreatments)
      setTreatmentCount(sharedTreatments.length)
      notifySubscribers()
    } catch (err) {
      // Rollback în caz de eroare
      const existingIndex = sharedTreatments.findIndex(t => t.id === id || t.resourceId === id)
      if (existingIndex >= 0) {
        sharedTreatments[existingIndex] = {
          ...sharedTreatments[existingIndex],
          _isOptimistic: false,
          _isDeleting: false
        }
        setTreatments(sharedTreatments)
        notifySubscribers()
      }
      
      setError(err.message)
      console.error('Error deleting treatment:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Caută tratamente
  const searchTreatments = useCallback(async (searchTerm, limit = 50) => {
    setLoading(true)
    setError(null)
    
    try {
      const treatmentsData = await treatmentService.searchTreatments(searchTerm, limit)
      sharedTreatments = treatmentsData
      setTreatments(treatmentsData)
      setTreatmentCount(treatmentsData.length)
      notifySubscribers()
    } catch (err) {
      setError(err.message)
      console.error('Error searching treatments:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Încarcă tratamentele după categorie
  const loadTreatmentsByCategory = useCallback(async (category) => {
    setLoading(true)
    setError(null)
    
    try {
      const treatmentsData = await treatmentService.getTreatmentsByCategory(category)
      const sortedTreatments = treatmentManager.sortTreatments(treatmentsData, sortBy, sortOrder)
      
      sharedTreatments = sortedTreatments
      setTreatments(sortedTreatments)
      setTreatmentCount(sortedTreatments.length)
      notifySubscribers()
    } catch (err) {
      setError(err.message)
      console.error('Error loading treatments by category:', err)
    } finally {
      setLoading(false)
    }
  }, [sortBy, sortOrder])

  // Încarcă tratamentele după tip
  const loadTreatmentsByType = useCallback(async (treatmentType) => {
    setLoading(true)
    setError(null)
    
    try {
      const treatmentsData = await treatmentService.getTreatmentsByType(treatmentType)
      const sortedTreatments = treatmentManager.sortTreatments(treatmentsData, sortBy, sortOrder)
      
      sharedTreatments = sortedTreatments
      setTreatments(sortedTreatments)
      setTreatmentCount(sortedTreatments.length)
      notifySubscribers()
    } catch (err) {
      setError(err.message)
      console.error('Error loading treatments by type:', err)
    } finally {
      setLoading(false)
    }
  }, [sortBy, sortOrder])

  // Obține statisticile
  const loadStats = useCallback(async () => {
    try {
      const statsData = await treatmentService.getStatistics()
      sharedStats = statsData
      setStats(statsData)
      notifySubscribers()
      return statsData
    } catch (err) {
      console.error('Error loading treatment stats:', err)
      return {
        total: 0,
        categories: {},
        averageDuration: 0,
        averagePrice: 0,
        totalRevenue: 0
      }
    }
  }, [])

  // Exportă tratamentele
  const exportTreatments = useCallback(async (format = 'json') => {
    try {
      const exportData = await treatmentService.exportTreatments(treatments, format)
      return exportData
    } catch (err) {
      console.error('Error exporting treatments:', err)
      throw err
    }
  }, [treatments])

  // Obține categoriile unice
  const getUniqueCategories = useCallback(() => {
    return treatmentManager.getUniqueCategories(treatments)
  }, [treatments])

  // Obține tipurile de tratamente unice
  const getUniqueTreatmentTypes = useCallback(() => {
    return treatmentManager.getUniqueTreatmentTypes(treatments)
  }, [treatments])

  // Încarcă tratamentele la prima renderizare
  useEffect(() => {
    loadTreatments()
  }, [loadTreatments])

  return {
    treatments,
    loading,
    error,
    stats,
    treatmentCount,
    filters,
    sortBy,
    sortOrder,
    loadTreatments,
    getTreatmentById,
    addTreatment,
    updateTreatment,
    deleteTreatment,
    searchTreatments,
    loadTreatmentsByCategory,
    loadTreatmentsByType,
    loadStats,
    exportTreatments,
    getUniqueCategories,
    getUniqueTreatmentTypes,
    setFilters,
    setSortBy,
    setSortOrder
  }
}
