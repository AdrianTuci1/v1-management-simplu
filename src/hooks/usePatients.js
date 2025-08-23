import { useState, useEffect, useCallback } from 'react'
import patientService from '../services/patientService.js'
import { indexedDb } from '../data/infrastructure/db.js'

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
        
        // Aplică filtrele pe datele din cache
        let filteredData = cachedData
        
        if (filters.status) {
          filteredData = filteredData.filter(p => p.status === filters.status)
        }
        if (filters.city) {
          filteredData = filteredData.filter(p => p.city === filters.city)
        }
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase()
          filteredData = filteredData.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.email.toLowerCase().includes(searchTerm) ||
            (p.phone && p.phone.includes(searchTerm)) ||
            (p.cnp && p.cnp.includes(searchTerm))
          )
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
      // Reîncarcă lista de pacienți
      await loadPatients()
      return newPatient
    } catch (err) {
      setError(err.message)
      console.error('Error adding patient:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadPatients])

  // Funcție pentru actualizarea unui pacient
  const updatePatient = useCallback(async (id, patientData) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedPatient = await patientService.updatePatient(id, patientData)
      // Reîncarcă lista de pacienți
      await loadPatients()
      return updatedPatient
    } catch (err) {
      setError(err.message)
      console.error('Error updating patient:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadPatients])

  // Funcție pentru ștergerea unui pacient
  const deletePatient = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      await patientService.deletePatient(id)
      // Reîncarcă lista de pacienți
      await loadPatients()
    } catch (err) {
      setError(err.message)
      console.error('Error deleting patient:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadPatients])

  // Funcție pentru obținerea statisticilor
  const loadStats = useCallback(async () => {
    try {
      const statsData = await patientService.getPatientStats()
      setStats(statsData)
      return statsData
    } catch (err) {
      console.error('Error loading patient stats:', err)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        newThisMonth: 0
      }
    }
  }, [])

  // Funcție pentru exportul pacienților
  const exportPatients = useCallback(async (format = 'csv') => {
    try {
      return await patientService.exportPatients(format)
    } catch (err) {
      setError(err.message)
      console.error('Error exporting patients:', err)
      throw err
    }
  }, [])

  // Încarcă datele la montarea componentei
  useEffect(() => {
    loadPatients()
    loadStats()
  }, [loadPatients, loadStats])

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
