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

// Nu mai generăm tempId în hook; Repository gestionează optimismul

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
        const cachedData = await indexedDb.getAll('patient')
        
        if (cachedData.length > 0) {
          // Transformăm datele din cache pentru UI
          const transformedData = cachedData.map(patient => 
            patientManager.transformPatientForUI(patient)
          )
          sharedPatients = transformedData
          setPatients([...transformedData])
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
        const cachedData = await indexedDb.getAll('patient')
        
        // Aplică filtrele local
        let filteredData = cachedData
        if (filters.name) {
          filteredData = filteredData.filter(patient => 
            (patient.name?.toLowerCase().includes(filters.name.toLowerCase())) ||
            (patient.patientName?.toLowerCase().includes(filters.name.toLowerCase()))
          )
        }
        if (filters.status) {
          filteredData = filteredData.filter(patient => patient.status === filters.status)
        }
        
        // Aplică paginarea
        const startIndex = (page - 1) * limit
        const paginatedData = filteredData.slice(startIndex, startIndex + limit)
        
        if (cachedData.length > 0) {
          // Transformăm datele din cache pentru UI
          const transformedData = paginatedData.map(patient => 
            patientManager.transformPatientForUI(patient)
          )
          sharedPatients = transformedData
          setPatients([...transformedData])
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
    
    // Dacă query-ul este gol, încarcă toți pacienții
    if (!query || query.trim().length === 0) {
      try {
        const data = await patientService.getPatients({ limit:'5' })
        sharedPatients = data
        setPatients([...data])
        notifySubscribers()
      } catch (err) {
        // Încearcă să încarce din cache local
        try {
          console.warn('Load patients API failed, trying local cache:', err.message)
          const cachedData = await indexedDb.getAll('patient')
          
          if (cachedData.length > 0) {
            // Transformăm datele din cache pentru UI
            const transformedData = cachedData.slice(0, limit).map(patient => 
              patientManager.transformPatientForUI(patient)
            )
            sharedPatients = transformedData
            setPatients([...transformedData])
            setError(null)
            notifySubscribers()
          } else {
            setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.')
          }
        } catch (cacheErr) {
          setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.')
          console.error('Error loading patients from cache:', err)
        }
      } finally {
        setLoading(false)
      }
      return
    }
    
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
          (patient.name?.toLowerCase().includes(query.toLowerCase())) ||
          (patient.patientName?.toLowerCase().includes(query.toLowerCase())) ||
          patient.email?.toLowerCase().includes(query.toLowerCase()) ||
          patient.phone?.includes(query)
        )
        
        if (cachedData.length > 0) {
          // Transformăm datele din cache pentru UI
          const transformedResults = searchResults.map(patient => 
            patientManager.transformPatientForUI(patient)
          )
          sharedPatients = transformedResults
          setPatients([...transformedResults])
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

  // Funcție pentru adăugarea unui pacient (optimism gestionat în Repository)
  const addPatient = useCallback(async (patientData) => {
    setError(null)
    
    try {
      const created = await patientService.addPatient(patientData)
      const ui = patientManager.transformPatientForUI(created)
      const idx = sharedPatients.findIndex(p => p.id === ui.id || p.resourceId === ui.resourceId)
      if (idx >= 0) {
        sharedPatients[idx] = { ...ui, _isOptimistic: false }
      } else {
        sharedPatients = [{ ...ui, _isOptimistic: !!ui._isOptimistic }, ...sharedPatients]
      }
      setPatients([...sharedPatients])
      notifySubscribers()
      return ui
    } catch (err) {
      setError(err.message)
      console.error('Error adding patient:', err)
      throw err
    }
  }, [])

  // Funcție pentru actualizarea unui pacient (optimism gestionat în Repository)
  const updatePatient = useCallback(async (id, patientData) => {
    setError(null)
    
    try {
      const updated = await patientService.updatePatient(id, patientData)
      const ui = patientManager.transformPatientForUI(updated)
      const idx = sharedPatients.findIndex(p => p.id === id || p.resourceId === id)
      if (idx >= 0) sharedPatients[idx] = { ...ui, _isOptimistic: false }
      setPatients([...sharedPatients])
      notifySubscribers()
      return ui
    } catch (err) {
      setError(err.message)
      console.error('Error updating patient:', err)
      throw err
    }
  }, [])

  // Funcție pentru ștergerea unui pacient (optimism gestionat în Repository)
  const deletePatient = useCallback(async (id) => {
    setError(null)
    
    try {
      await patientService.deletePatient(id)
      sharedPatients = sharedPatients.filter(p => (p.id !== id && p.resourceId !== id))
      setPatients([...sharedPatients])
      notifySubscribers()
      return true
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
      if (resourceType !== 'patient') return
      const operation = type?.replace('resource_', '') || type
      const id = data?.id || data?.resourceId
      if (!id) return
      if (operation === 'created' || operation === 'create') {
        const ui = patientManager.transformPatientForUI({ ...data, id, resourceId: id })
        const idx = sharedPatients.findIndex(p => p.id === id || p.resourceId === id)
        if (idx >= 0) sharedPatients[idx] = { ...ui, _isOptimistic: false }
        else sharedPatients = [{ ...ui, _isOptimistic: false }, ...sharedPatients]
        setPatients([...sharedPatients])
        notifySubscribers()
      } else if (operation === 'updated' || operation === 'update') {
        const ui = patientManager.transformPatientForUI({ ...data, id, resourceId: id })
        const idx = sharedPatients.findIndex(p => p.id === id || p.resourceId === id)
        if (idx >= 0) sharedPatients[idx] = { ...ui, _isOptimistic: false }
        else sharedPatients = [{ ...ui, _isOptimistic: false }, ...sharedPatients]
        setPatients([...sharedPatients])
        notifySubscribers()
      } else if (operation === 'deleted' || operation === 'delete') {
        sharedPatients = sharedPatients.filter(p => (p.id !== id && p.resourceId !== id))
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
