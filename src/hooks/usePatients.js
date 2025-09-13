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
  console.log('Notifying subscribers. Count:', subscribers.size, 'Patients count:', sharedPatients.length)
  subscribers.forEach(cb => cb([...sharedPatients]))
}

// Funcție pentru generarea unui ID temporar
function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
      setPatients([...data])
      notifySubscribers()
    } catch (err) {
      // Încearcă să încarce din cache local
      try {
        console.warn('Patients API failed, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('patients')
        
        if (cachedData.length > 0) {
          sharedPatients = cachedData
          setPatients([...cachedData])
          setError(null) // Nu setează eroarea când avem date din cache
          notifySubscribers()
        } else {
          setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.')
        }
      } catch (cacheErr) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.')
        console.error('Error loading patients:', err)
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
      sharedPatients = data
      setPatients([...data])
      notifySubscribers()
    } catch (err) {
      // Încearcă să încarce din cache local cu filtrare
      try {
        console.warn('Patients by page API failed, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('patients')
        
        // Aplică filtrele local
        let filteredData = cachedData
        if (filters.name) {
          filteredData = filteredData.filter(patient => 
            patient.name?.toLowerCase().includes(filters.name.toLowerCase())
          )
        }
        if (filters.status) {
          filteredData = filteredData.filter(patient => patient.status === filters.status)
        }
        
        // Aplică paginarea
        const startIndex = (page - 1) * limit
        const paginatedData = filteredData.slice(startIndex, startIndex + limit)
        
        if (cachedData.length > 0) {
          sharedPatients = paginatedData
          setPatients([...paginatedData])
          setError(null) // Nu setează eroarea când avem date din cache
          notifySubscribers()
        } else {
          setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.')
        }
      } catch (cacheErr) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.')
        console.error('Error loading patients by page:', err)
      }
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
      setPatients([...data])
      notifySubscribers()
    } catch (err) {
      // Căutare în cache local când API-ul eșuează
      try {
        console.warn('Search patients API failed, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('patients')
        
        // Căutare locală în mai multe câmpuri
        const searchResults = cachedData.filter(patient => 
          patient.name?.toLowerCase().includes(query.toLowerCase()) ||
          patient.email?.toLowerCase().includes(query.toLowerCase()) ||
          patient.phone?.includes(query)
        )
        
        if (cachedData.length > 0) {
          sharedPatients = searchResults
          setPatients([...searchResults])
          setError(null) // Căutarea offline funcționează
          notifySubscribers()
        } else {
          setError('Nu s-au putut căuta datele. Verifică conexiunea la internet.')
        }
      } catch (cacheErr) {
        setError('Nu s-au putut căuta datele. Verifică conexiunea la internet.')
        console.error('Error searching patients:', err)
      }
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
    
    // Generează ID temporar pentru optimistic update
    const tempId = generateTempId()
    const optimisticPatient = {
      ...patientManager.transformPatientForUI(patientData),
      _tempId: tempId,
      _isOptimistic: true,
      id: tempId // Folosim tempId ca ID pentru optimistic update
    }
    
    // Adaugă pacientul optimist în shared state
    sharedPatients = [optimisticPatient, ...sharedPatients]
    setPatients([...sharedPatients])
    notifySubscribers()
    
    try {
      const newPatient = await patientService.addPatient(patientData)
      return newPatient
    } catch (err) {
      // În caz de eroare, elimină pacientul optimist
      sharedPatients = sharedPatients.filter(p => p._tempId !== tempId)
      setPatients([...sharedPatients])
      notifySubscribers()
      
      setError(err.message)
      console.error('Error adding patient:', err)
      throw err
    }
  }, [])

  // Funcție pentru actualizarea unui pacient
  const updatePatient = useCallback(async (id, patientData) => {
    setError(null)
    
    // Găsește pacientul existent
    const existingPatient = sharedPatients.find(p => p.id === id || p.resourceId === id)
    if (!existingPatient) {
      throw new Error('Patient not found')
    }
    
    // Creează versiunea optimistă
    const optimisticPatient = {
      ...existingPatient,
      ...patientManager.transformPatientForUI(patientData),
      _isOptimistic: true
    }
    
    // Actualizează pacientul optimist în shared state
    sharedPatients = sharedPatients.map(p => 
      (p.id === id || p.resourceId === id) ? optimisticPatient : p
    )
    setPatients([...sharedPatients])
    notifySubscribers()
    
    try {
      const updatedPatient = await patientService.updatePatient(id, patientData)
      return updatedPatient
    } catch (err) {
      // În caz de eroare, restaurează pacientul original
      sharedPatients = sharedPatients.map(p => 
        (p.id === id || p.resourceId === id) ? existingPatient : p
      )
      setPatients([...sharedPatients])
      notifySubscribers()
      
      setError(err.message)
      console.error('Error updating patient:', err)
      throw err
    }
  }, [])

  // Funcție pentru ștergerea unui pacient
  const deletePatient = useCallback(async (id) => {
    setError(null)
    
    // Găsește pacientul existent
    const existingPatient = sharedPatients.find(p => p.id === id || p.resourceId === id)
    if (!existingPatient) {
      throw new Error('Patient not found')
    }
    
    // Marchează pacientul ca fiind șters optimist
    const optimisticPatient = {
      ...existingPatient,
      _isOptimistic: true,
      _isDeleting: true
    }
    
    // Actualizează pacientul optimist în shared state
    sharedPatients = sharedPatients.map(p => 
      (p.id === id || p.resourceId === id) ? optimisticPatient : p
    )
    setPatients([...sharedPatients])
    notifySubscribers()
    
    try {
      await patientService.deletePatient(id)
    } catch (err) {
      // În caz de eroare, restaurează pacientul original
      sharedPatients = sharedPatients.map(p => 
        (p.id === id || p.resourceId === id) ? existingPatient : p
      )
      setPatients([...sharedPatients])
      notifySubscribers()
      
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
    setPatients([...sharedPatients])
    setStats(sharedStats)
    
    // Adaugă subscriber pentru actualizări
    const subscriber = (newPatients) => {
      console.log('Subscriber called with patients count:', newPatients.length)
      setPatients(newPatients)
    }
    subscribers.add(subscriber)
    const unsub = () => subscribers.delete(subscriber)
    
    // Initial data load
    loadPatients()
    loadStats()
    
    // Subscribe la actualizări prin websocket
    const handler = async (message) => {
      const { type, data, resourceType } = message
      
      console.log('WebSocket message received:', { type, resourceType, data })
      
      // Verifică dacă este pentru pacienți
      if (resourceType !== 'patient') return
      
      // Extrage operația din tipul mesajului
      const operation = type?.replace('resource_', '') || 'unknown'
      const patientId = data?.id
      
      console.log('Processing patient operation:', { operation, patientId })
      
      if (!patientId) return
      
      // Procesează operația
      if (operation === 'created') {
        const ui = patientManager.transformPatientForUI({ ...data, id: patientId, resourceId: patientId })
        
        // Actualizează IndexedDB cu datele reale
        await indexedDb.put('patients', { ...ui, _isOptimistic: false })
        
        // Caută în outbox pentru a găsi operația optimistă
        const outboxEntry = await indexedDb.outboxFindByResourceId(patientId, 'patients')
        
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
        
        // Actualizează starea locală și notifică toți subscriberii
        console.log('Updating patients state after CREATED operation. Current count:', sharedPatients.length)
        setPatients([...sharedPatients])
        notifySubscribers()
        
      } else if (operation === 'updated') {
        const ui = patientManager.transformPatientForUI({ ...data, id: patientId, resourceId: patientId })
        
        // Actualizează IndexedDB cu datele reale
        await indexedDb.put('patients', { ...ui, _isOptimistic: false })
        
        // Caută pacientul în shared state și dezactivează _isOptimistic
        const existingIndex = sharedPatients.findIndex(p => p.id === patientId || p.resourceId === patientId)
        
        if (existingIndex >= 0) {
          // Actualizează pacientul existent și dezactivează optimistic flag
          sharedPatients[existingIndex] = { ...ui, _isOptimistic: false }
          console.log('Updated patient and disabled optimistic flag')
        } else {
          // Adaugă pacientul nou dacă nu există
          sharedPatients = [{ ...ui, _isOptimistic: false }, ...sharedPatients]
        }
        
        // Actualizează starea locală și notifică toți subscriberii
        console.log('Updating patients state after UPDATED operation. Current count:', sharedPatients.length)
        setPatients([...sharedPatients])
        notifySubscribers()
        
      } else if (operation === 'deleted') {
        // Șterge din IndexedDB
        await indexedDb.delete('patients', patientId)
        
        // Șterge din shared state și dezactivează _isOptimistic
        sharedPatients = sharedPatients.filter(p => {
          const matches = p.id === patientId || p.resourceId === patientId
          if (matches && p._isOptimistic) {
            console.log('Removed optimistic patient after deletion confirmation')
          }
          return !matches
        })
        
        // Actualizează starea locală și notifică toți subscriberii
        console.log('Updating patients state after DELETED operation. Current count:', sharedPatients.length)
        setPatients([...sharedPatients])
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
