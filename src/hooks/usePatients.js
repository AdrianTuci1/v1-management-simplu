import { useState, useEffect, useCallback } from 'react'
import patientService from '../services/patientService.js'
import patientManager from '../business/patientManager.js'
import { indexedDb } from '../data/infrastructure/db.js'
import { onResourceMessage } from '../data/infrastructure/websocketClient.js'

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
      const added = await patientService.addPatient(patientData)
      // Actualizare optimistă în memorie
      const uiPatient = patientManager.transformPatientForUI(added)
      setPatients(prev => [uiPatient, ...prev])
      // Dacă serverul a returnat rezultat final (non-optimist), sincronizează din sursa oficială
      if (!added._isOptimistic) {
        await loadPatients()
      }
      return added
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
      const updated = await patientService.updatePatient(id, patientData)
      const uiUpdated = patientManager.transformPatientForUI({ ...updated, resourceId: updated.resourceId || id, id })
      // Actualizare optimistă în memorie
      setPatients(prev => prev.map(p => (p.id === id ? { ...p, ...uiUpdated } : p)))
      if (!updated._isOptimistic) {
        await loadPatients()
      }
      return updated
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
      // Eliminare optimistă în memorie
      setPatients(prev => prev.filter(p => p.id !== id))
      await patientService.deletePatient(id)
      // Pentru răspuns non-optimist putem valida cu o încărcare, însă așteptăm reconcilierea via websocket
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
    // Subscribe la actualizări prin websocket pentru reconcilierea ID-urilor temporare
    const handler = async (message) => {
      const { type, data, tempId, realId, operation, resourceType } = message
      if (!resourceType || (resourceType !== 'patient' && resourceType !== 'patients')) return
      // Normalize operations coming from worker (create/update/delete)
      const op = operation || (type && type.replace('resource_', '').replace('_resolved', ''))
      if (!op) return
      const finalId = realId || data?.resourceId || data?.id
      if (op === 'create') {
        if (finalId) {
          const ui = patientManager.transformPatientForUI({ ...data, id: finalId, resourceId: finalId })
          await indexedDb.put('patients', { ...ui, _isOptimistic: false })
          setPatients(prev => {
            // Replace by temp match or add if not present
            const byTemp = tempId ? prev.findIndex(p => p._tempId === tempId) : -1
            if (byTemp >= 0) {
              const next = [...prev]
              next[byTemp] = { ...ui }
              return next
            }
            // Try to match by email/phone/name if tempId is missing
            const byHeuristic = prev.findIndex(p => (
              (p.email && ui.email && p.email === ui.email) ||
              (p.phone && ui.phone && p.phone === ui.phone) ||
              (p.name && ui.name && p.name === ui.name)
            ))
            if (byHeuristic >= 0) {
              const next = [...prev]
              next[byHeuristic] = { ...ui }
              return next
            }
            return [ui, ...prev]
          })
        }
      } else if (op === 'update') {
        if (finalId) {
          const ui = patientManager.transformPatientForUI({ ...data, id: finalId, resourceId: finalId })
          await indexedDb.put('patients', { ...ui, _isOptimistic: false })
          setPatients(prev => prev.map(p => (p.id === finalId ? { ...p, ...ui } : p)))
        }
      } else if (op === 'delete') {
        if (finalId) {
          await indexedDb.delete('patients', finalId)
          setPatients(prev => prev.filter(p => p.id !== finalId))
        }
      }
    }
    const unsubPlural = onResourceMessage('patients', handler)
    const unsubSingular = onResourceMessage('patient', handler)
    return () => { unsubPlural(); unsubSingular() }
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
