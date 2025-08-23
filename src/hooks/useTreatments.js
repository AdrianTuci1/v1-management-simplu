import { useState, useEffect, useCallback } from 'react'
import treatmentService from '../services/treatmentService.js'
import treatmentManager from '../business/treatmentManager.js'
import { indexedDb } from '../data/infrastructure/db.js'
import { populateTestData, checkCacheStatus } from '../utils/treatmentUtils.js'

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

  // Încarcă toate tratamentele
  const loadTreatments = useCallback(async (customFilters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const allFilters = { ...filters, ...customFilters }
      const treatmentsData = await treatmentService.getTreatments(allFilters)
      
      // Aplică filtrele și sortarea
      let filteredTreatments = treatmentManager.filterTreatments(treatmentsData, allFilters)
      filteredTreatments = treatmentManager.sortTreatments(filteredTreatments, sortBy, sortOrder)
      
      setTreatments(filteredTreatments)
      setTreatmentCount(filteredTreatments.length)
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
          setTreatments(testData)
          setTreatmentCount(testData.length)
          setError('Conectare la server eșuată. Se afișează datele de test din cache local.')
          return testData
        }
        
        setTreatments(cachedData)
        setTreatmentCount(cachedData.length)
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
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

  // Adaugă un tratament nou
  const addTreatment = useCallback(async (treatmentData) => {
    setLoading(true)
    setError(null)
    
    try {
      const newTreatment = await treatmentService.addTreatment(treatmentData)
      setTreatments(prev => [...prev, newTreatment])
      setTreatmentCount(prev => prev + 1)
      return newTreatment
    } catch (err) {
      setError(err.message)
      console.error('Error adding treatment:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizează un tratament
  const updateTreatment = useCallback(async (id, treatmentData) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedTreatment = await treatmentService.updateTreatment(id, treatmentData)
      setTreatments(prev => prev.map(t => t.id === id ? updatedTreatment : t))
      return updatedTreatment
    } catch (err) {
      setError(err.message)
      console.error('Error updating treatment:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Șterge un tratament
  const deleteTreatment = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      await treatmentService.deleteTreatment(id)
      setTreatments(prev => prev.filter(t => t.id !== id))
      setTreatmentCount(prev => prev - 1)
    } catch (err) {
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
      setTreatments(treatmentsData)
      setTreatmentCount(treatmentsData.length)
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
      
      setTreatments(sortedTreatments)
      setTreatmentCount(sortedTreatments.length)
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
      
      setTreatments(sortedTreatments)
      setTreatmentCount(sortedTreatments.length)
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
      setStats(statsData)
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
