import { useState, useEffect, useCallback } from 'react'
import patientService from '../services/patientService.js'
import patientManager from '../business/patientManager.js'
import { indexedDb } from '../data/infrastructure/db.js'
import { onResourceMessage } from '../data/infrastructure/websocketClient.js'

// Shared state for all instances
let sharedPatients = []
let sharedStats = {
  total: 0,
  active: 0,
  inactive: 0,
  newThisMonth: 0
}
let subscribers = new Set()

function notifySubscribers() {
  subscribers.forEach(cb => cb(sharedPatients))
}

export const usePatients = () => {
  const [patients, setPatients] = useState(sharedPatients)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(sharedStats)

  // Funcție pentru încărcarea pacienților
  const loadPatients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await patientService.getPatients()
      sharedPatients = data
      setPatients(data)
      notifySubscribers()
    } catch (err) {
      setError(err.message)
      console.error('Error loading patients:', err)
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
      sharedPatients = data
      setPatients(data)
      notifySubscribers()
    } catch (err) {
      setError(err.message)
      console.error('Error loading patients by page:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru căutarea pacienților
  const searchPatients = useCallback(async (query) => {
    setLoading(true)
    setError(null)
    try {
      const data = await patientService.searchPatients(query)
      sharedPatients = data
      setPatients(data)
      notifySubscribers()
    } catch (err) {
      setError(err.message)
      console.error('Error searching patients:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru obținerea unui pacient după ID
  const getPatientById = useCallback(async (id) => {
    try {
      return await patientService.getPatientById(id)
    } catch (err) {
      setError(err.message)
      console.error('Error getting patient by ID:', err)
      throw err
    }
  }, [])

  // Funcție pentru adăugarea unui pacient
  const addPatient = useCallback(async (patientData) => {
    setError(null)
    try {
      const newPatient = await patientService.addPatient(patientData)
      sharedPatients = [newPatient, ...sharedPatients]
      setPatients(sharedPatients)
      notifySubscribers()
      return newPatient
    } catch (err) {
      setError(err.message)
      console.error('Error adding patient:', err)
      throw err
    }
  }, [])

  // Funcție pentru actualizarea unui pacient
  const updatePatient = useCallback(async (id, patientData) => {
    setError(null)
    try {
      const updatedPatient = await patientService.updatePatient(id, patientData)
      sharedPatients = sharedPatients.map(p => p.id === id ? updatedPatient : p)
      setPatients(sharedPatients)
      notifySubscribers()
      return updatedPatient
    } catch (err) {
      setError(err.message)
      console.error('Error updating patient:', err)
      throw err
    }
  }, [])

  // Funcție pentru ștergerea unui pacient
  const deletePatient = useCallback(async (id) => {
    setError(null)
    try {
      await patientService.deletePatient(id)
      sharedPatients = sharedPatients.filter(p => p.id !== id)
      setPatients(sharedPatients)
      notifySubscribers()
    } catch (err) {
      setError(err.message)
      console.error('Error deleting patient:', err)
      throw err
    }
  }, [])

  // Funcție pentru încărcarea statisticilor
  const loadStats = useCallback(async () => {
    try {
      const data = await patientService.getPatientStats()
      sharedStats = data
      setStats(data)
    } catch (err) {
      console.error('Error loading stats:', err)
      // Fallback stats
      sharedStats = {
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
    // Initialize from shared state and subscribe to updates
    setPatients(sharedPatients)
    setStats(sharedStats)
    const unsub = (cb => { subscribers.add(cb); return () => subscribers.delete(cb) })(setPatients)
    
    // Initial data load
    loadPatients()
    loadStats()
    
    // Subscribe la actualizări prin websocket
    const handler = async (message) => {
      const { type, data, resourceType } = message
      
      // Verifică dacă este pentru pacienți
      if (resourceType !== 'patient') return
      
      // Extrage operația din tipul mesajului
      const operation = type?.replace('resource_', '') || 'unknown'
      const patientId = data?.id
      
      if (!patientId) return
      
      // Procesează operația
      if (operation === 'created' || operation === 'updated') {
        const ui = patientManager.transformPatientForUI({ ...data, id: patientId, resourceId: patientId })
        
        // Actualizează IndexedDB cu datele reale
        await indexedDb.put('patients', { ...ui, _isOptimistic: false })
        
        // Caută în outbox pentru a găsi operația optimistă
        const outboxEntry = await indexedDb.outboxFindByTempId(patientId)
        
        if (outboxEntry) {
          // Găsește pacientul optimist în shared state prin tempId
          const optimisticIndex = sharedPatients.findIndex(p => p._tempId === outboxEntry.tempId)
          
          if (optimisticIndex >= 0) {
            // Înlocuiește pacientul optimist cu datele reale
            sharedPatients[optimisticIndex] = { ...ui, _isOptimistic: false }
            console.log('Replaced optimistic patient with real data from outbox')
          }
          
          // Șterge din outbox
          await indexedDb.outboxDelete(outboxEntry.id)
        } else {
          // Dacă nu găsește în outbox, caută prin ID normal
          const existingIndex = sharedPatients.findIndex(p => p.id === patientId || p.resourceId === patientId)
          
          if (existingIndex >= 0) {
            // Actualizează pacientul existent
            sharedPatients[existingIndex] = { ...ui, _isOptimistic: false }
          } else {
            // Adaugă pacientul nou
            sharedPatients = [{ ...ui, _isOptimistic: false }, ...sharedPatients]
          }
        }
        
        setPatients(sharedPatients)
        notifySubscribers()
        
      } else if (operation === 'deleted') {
        // Șterge din IndexedDB
        await indexedDb.delete('patients', patientId)
        
        // Șterge din shared state
        sharedPatients = sharedPatients.filter(p => p.id !== patientId && p.resourceId !== patientId)
        setPatients(sharedPatients)
        notifySubscribers()
      }
    }
    
    const unsubPlural = onResourceMessage('patients', handler)
    const unsubSingular = onResourceMessage('patient', handler)
    
    return () => { 
      unsubPlural(); 
      unsubSingular(); 
      unsub() 
    }
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
