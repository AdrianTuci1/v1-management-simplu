import { useState, useEffect, useCallback } from 'react'
import patientService from '../services/patientService.js'
import { indexedDb } from '../data/infrastructure/db.js'
import { populateTestPatients, checkPatientCacheStatus } from '../utils/patientUtils.js'

export const usePatients = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0
  })

  // Funcție pentru încărcarea pacienților cu gestionarea erorilor
  const loadPatients = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await patientService.getPatients(params)
      setPatients(data)
      return data
    } catch (err) {
      // Încearcă să încarce din cache local dacă API-ul eșuează
      try {
        console.warn('API failed, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('patients')
        
        // Dacă cache-ul este gol, populează cu date de test
        if (cachedData.length === 0) {
          console.log('Cache is empty, populating with test data...')
          await populateTestPatients()
          const testData = await indexedDb.getAll('patients')
          setPatients(testData)
          setError('Conectare la server eșuată. Se afișează datele de test din cache local.')
          return testData
        }
        
        setPatients(cachedData)
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        return cachedData
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error loading patients:', err)
        return []
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru încărcarea pacienților cu paginare
  const loadPatientsByPage = useCallback(async (page = 1, limit = 20, filters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await patientService.getPatientsByPage(page, limit, filters)
      setPatients(data)
      return data
    } catch (err) {
      try {
        console.warn('API failed for pagination, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('patients')
        
        // Aplică filtrele local
        let filteredData = cachedData
        if (filters.name) {
          const searchTerm = filters.name.toLowerCase()
          filteredData = filteredData.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.email.toLowerCase().includes(searchTerm)
          )
        }
        if (filters.status) {
          filteredData = filteredData.filter(p => p.status === filters.status)
        }
        
        // Aplică paginarea
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedData = filteredData.slice(startIndex, endIndex)
        
        setPatients(paginatedData)
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        return paginatedData
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error loading patients by page:', err)
        return []
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru căutarea pacienților
  const searchPatients = useCallback(async (searchTerm, limit = 50) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await patientService.searchPatients(searchTerm, limit)
      setPatients(data)
      return data
    } catch (err) {
      try {
        console.warn('API failed for search, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('patients')
        
        const searchTermLower = searchTerm.toLowerCase()
        const filteredData = cachedData.filter(p => 
          p.name.toLowerCase().includes(searchTermLower) ||
          p.email.toLowerCase().includes(searchTermLower) ||
          (p.phone && p.phone.includes(searchTerm)) ||
          (p.cnp && p.cnp.includes(searchTerm))
        ).slice(0, limit)
        
        setPatients(filteredData)
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        return filteredData
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error searching patients:', err)
        return []
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru obținerea unui pacient după ID
  const getPatientById = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      const patient = await patientService.getPatientById(id)
      return patient
    } catch (err) {
      try {
        console.warn('API failed for patient by ID, trying local cache:', err.message)
        const patient = await indexedDb.get('patients', id)
        return patient
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error getting patient by ID:', err)
        return null
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru adăugarea unui pacient
  const addPatient = useCallback(async (patientData) => {
    setLoading(true)
    setError(null)
    
    try {
      const newPatient = await patientService.addPatient(patientData)
      setPatients(prev => [...prev, newPatient])
      return newPatient
    } catch (err) {
      setError(err.message)
      console.error('Error adding patient:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru actualizarea unui pacient
  const updatePatient = useCallback(async (id, patientData) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedPatient = await patientService.updatePatient(id, patientData)
      setPatients(prev => prev.map(p => p.id === id ? updatedPatient : p))
      return updatedPatient
    } catch (err) {
      setError(err.message)
      console.error('Error updating patient:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru ștergerea unui pacient
  const deletePatient = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      await patientService.deletePatient(id)
      setPatients(prev => prev.filter(p => p.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error deleting patient:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru obținerea statisticilor
  const loadStats = useCallback(async () => {
    try {
      const patientStats = await patientService.getPatientStats()
      setStats(patientStats)
      return patientStats
    } catch (err) {
      try {
        console.warn('API failed for stats, calculating from cache:', err.message)
        const cachedData = await indexedDb.getAll('patients')
        
        const stats = {
          total: cachedData.length,
          active: cachedData.filter(p => p.status === 'active').length,
          inactive: cachedData.filter(p => p.status === 'inactive').length,
          newThisMonth: cachedData.filter(p => {
            const createdAt = new Date(p.createdAt)
            const now = new Date()
            return createdAt.getMonth() === now.getMonth() && 
                   createdAt.getFullYear() === now.getFullYear()
          }).length
        }
        
        setStats(stats)
        return stats
      } catch (cacheErr) {
        console.error('Error loading patient stats:', err)
        return {
          total: 0,
          active: 0,
          inactive: 0,
          newThisMonth: 0
        }
      }
    }
  }, [])

  // Funcție pentru exportul pacienților
  const exportPatients = useCallback(async (format = 'csv') => {
    setLoading(true)
    setError(null)
    
    try {
      const exportData = await patientService.exportPatients(format)
      return exportData
    } catch (err) {
      setError(err.message)
      console.error('Error exporting patients:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Încarcă statisticile la montarea componentei
  useEffect(() => {
    loadStats()
  }, [loadStats])

  return {
    patients,
    loading,
    error,
    stats,
    loadPatients,
    loadPatientsByPage,
    searchPatients,
    getPatientById,
    addPatient,
    updatePatient,
    deletePatient,
    loadStats,
    exportPatients
  }
}
