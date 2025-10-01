import { useState, useCallback, useEffect } from 'react'
import appointmentService from '../services/appointmentService.js'
import { indexedDb } from '../data/infrastructure/db.js'
import { onResourceMessage } from '../data/infrastructure/websocketClient.js'
import { populateTestData, updateLookupCache } from '../utils/appointmentUtils.js'
import appointmentManager from '../business/appointmentManager.js'

// Shared state pentru toate instanțele
let sharedAppointments = []
let sharedAppointmentsCount = {}
let subscribers = new Set()

// Funcție pentru notificarea subscriberilor
function notifySubscribers() {
  console.log('Notifying appointment subscribers. Count:', subscribers.size, 'Appointments count:', sharedAppointments.length)
  subscribers.forEach(cb => cb([...sharedAppointments]))
}

// Funcție pentru generarea unui ID temporar
function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState(sharedAppointments)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [appointmentsCount, setAppointmentsCount] = useState(sharedAppointmentsCount)

  // Funcție pentru încărcarea programărilor cu gestionarea erorilor
  const loadAppointments = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await appointmentService.getAppointments(params)
      // Transformăm datele pentru UI
      const transformedData = data.map(appointment => appointmentManager.transformAppointmentForUI(appointment))
      sharedAppointments = transformedData
      setAppointments([...transformedData])
      notifySubscribers()
      return transformedData
    } catch (err) {
      // Încearcă să încarce din cache local dacă API-ul eșuează
      try {
        console.warn('API failed, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('appointments')
        
        // Dacă cache-ul este gol, populează cu date de test
        if (cachedData.length === 0) {
          console.log('Cache is empty, populating with test data...')
          await populateTestData()
          const testData = await indexedDb.getAll('appointments')
          const transformedData = testData.map(appointment => appointmentManager.transformAppointmentForUI(appointment))
          sharedAppointments = transformedData
          setAppointments([...transformedData])
          notifySubscribers()
          setError('Conectare la server eșuată. Se afișează datele de test din cache local.')
          return transformedData
        }
        
        const transformedData = cachedData.map(appointment => appointmentManager.transformAppointmentForUI(appointment))
        sharedAppointments = transformedData
        setAppointments([...transformedData])
        notifySubscribers()
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        return transformedData
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error loading appointments:', err)
        return []
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru încărcarea programărilor pentru o zi specifică
  const loadAppointmentsByDate = useCallback(async (date) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await appointmentService.getAppointmentsByDate(date)
      const transformedData = data.map(appointment => appointmentManager.transformAppointmentForUI(appointment))
      sharedAppointments = transformedData
      setAppointments([...transformedData])
      notifySubscribers()
      return transformedData
    } catch (err) {
      setError(err.message)
      console.error('Error loading appointments by date:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru încărcarea programărilor pentru o săptămână
  const loadAppointmentsByWeek = useCallback(async (startDate) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await appointmentService.getAppointmentsByWeek(startDate)
      const transformedData = data.map(appointment => appointmentManager.transformAppointmentForUI(appointment))
      sharedAppointments = transformedData
      setAppointments([...transformedData])
      notifySubscribers()
      return transformedData
    } catch (err) {
      // Încearcă să încarce din cache local dacă API-ul eșuează
      try {
        console.warn('API failed for week view, trying local cache:', err.message)
        const startOfWeek = new Date(startDate)
        const dayOfWeek = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        const monday = new Date(startOfWeek.setDate(diff))
        monday.setHours(0, 0, 0, 0)

        const endOfWeek = new Date(monday)
        endOfWeek.setDate(monday.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)

        const cachedData = await indexedDb.getAppointmentsByDateRange(monday, endOfWeek)
        const transformedData = cachedData.map(appointment => appointmentManager.transformAppointmentForUI(appointment))
        sharedAppointments = transformedData
        setAppointments([...transformedData])
        notifySubscribers()
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        return transformedData
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error loading appointments by week:', err)
        return []
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru încărcarea programărilor pentru o lună
  const loadAppointmentsByMonth = useCallback(async (year, month) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await appointmentService.getAppointmentsByMonth(year, month)
      const transformedData = data.map(appointment => appointmentManager.transformAppointmentForUI(appointment))
      sharedAppointments = transformedData
      setAppointments([...transformedData])
      notifySubscribers()
      return transformedData
    } catch (err) {
      // Încearcă să încarce din cache local dacă API-ul eșuează
      try {
        console.warn('API failed for month view, trying local cache:', err.message)
        const startOfMonth = new Date(year, month, 1)
        const endOfMonth = new Date(year, month + 1, 0)
        endOfMonth.setHours(23, 59, 59, 999)

        const cachedData = await indexedDb.getAppointmentsByDateRange(startOfMonth, endOfMonth)
        const transformedData = cachedData.map(appointment => appointmentManager.transformAppointmentForUI(appointment))
        sharedAppointments = transformedData
        setAppointments([...transformedData])
        notifySubscribers()
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        return transformedData
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error loading appointments by month:', err)
        return []
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru adăugarea unei programări (optimism gestionat de Repository)
  const addAppointment = useCallback(async (appointmentData) => {
    setError(null)
    appointmentManager.validateAppointment(appointmentData)
    const apiData = appointmentManager.transformAppointmentForAPI(appointmentData)
    try {
      const created = await appointmentService.addAppointment(apiData)
      const ui = appointmentManager.transformAppointmentForUI(created)
      
      // Doar resursele optimistice sunt adăugate imediat în shared state
      // Resursele cu ID real vor fi adăugate de WebSocket
      if (ui._isOptimistic || ui._tempId) {
        const idx = sharedAppointments.findIndex(a => a._tempId === ui._tempId)
        if (idx >= 0) {
          sharedAppointments[idx] = ui
        } else {
          sharedAppointments = [ui, ...sharedAppointments]
        }
        setAppointments([...sharedAppointments])
        notifySubscribers()
      }
      
      return ui
    } catch (err) {
      setError(err.message)
      console.error('Error adding appointment:', err)
      throw err
    }
  }, [])

  // Funcție pentru actualizarea unei programări (optimism gestionat de Repository)
  const updateAppointment = useCallback(async (id, appointmentData) => {
    setError(null)
    if (!id) throw new Error('Appointment ID is required for update')
    appointmentManager.validateAppointment(appointmentData)
    const apiData = appointmentManager.transformAppointmentForAPI(appointmentData)
    try {
      const updated = await appointmentService.updateAppointment(id, apiData)
      const ui = appointmentManager.transformAppointmentForUI(updated)
      const idx = sharedAppointments.findIndex(a => a.id === id || a.resourceId === id)
      if (idx >= 0) sharedAppointments[idx] = { ...ui, _isOptimistic: false }
      setAppointments([...sharedAppointments])
      notifySubscribers()
      return ui
    } catch (err) {
      setError(err.message)
      console.error('Error updating appointment:', err)
      throw err
    }
  }, [])

  // Funcție pentru ștergerea unei programări (optimism gestionat de Repository)
  const deleteAppointment = useCallback(async (id) => {
    setError(null)
    if (!id) throw new Error('Appointment ID is required for deletion')
    try {
      await appointmentService.deleteAppointment(id)
      sharedAppointments = sharedAppointments.filter(a => (a.id !== id && a.resourceId !== id))
      setAppointments([...sharedAppointments])
      notifySubscribers()
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error deleting appointment:', err)
      throw err
    }
  }, [])

  // Funcție pentru încărcarea numărului de programări pentru mai multe date
  const loadAppointmentsCount = useCallback(async (dates, existingAppointments = null) => {
    try {
      // Dacă nu avem date, returnăm obiect gol
      if (!dates || dates.length === 0) {
        setAppointmentsCount({})
        return {}
      }

      let allAppointments = existingAppointments || sharedAppointments

      // Dacă nu avem programări existente, facem o cerere pentru întreaga perioadă
      if (!allAppointments || allAppointments.length === 0) {
        const sortedDates = [...dates].sort((a, b) => a - b)
        const startDate = sortedDates[0]
        const endDate = sortedDates[sortedDates.length - 1]

        // Formatăm datele în format yyyy-mm-dd
        const formatDate = (date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        allAppointments = await appointmentService.getAppointments({
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        })
      }

      // Funcție pentru formatarea datelor în format yyyy-mm-dd
      const formatDate = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      // Calculăm numărul de programări pentru fiecare zi
      const counts = {}
      dates.forEach(date => {
        const dateKey = formatDate(date)
        const dayAppointments = allAppointments.filter(appointment => {
          const appointmentDate = appointment.date || appointment.startDate
          return appointmentDate === dateKey
        })
        counts[dateKey] = dayAppointments.length
      })

      sharedAppointmentsCount = counts
      setAppointmentsCount(counts)
      return counts
    } catch (err) {
      // Fallback la cache local pentru numărul de programări
      try {
        console.warn('API failed for appointment counts, using local cache')
        const counts = {}
        for (const date of dates) {
          const count = await indexedDb.getAppointmentCount(date)
          counts[formatDate(date)] = count
        }
        sharedAppointmentsCount = counts
        setAppointmentsCount(counts)
        return counts
      } catch (cacheErr) {
        console.error('Error loading appointments count:', err)
        return {}
      }
    }
  }, [])

  // Funcție pentru resetarea stării
  const reset = useCallback(() => {
    sharedAppointments = []
    setAppointments([])
    setLoading(false)
    setError(null)
    setAppointmentsCount({})
    notifySubscribers()
  }, [])

  // Funcție pentru popularea datelor de test
  const populateWithTestData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      await populateTestData()
      const testData = await indexedDb.getAll('appointments')
      const transformedData = testData.map(appointment => appointmentManager.transformAppointmentForUI(appointment))
      sharedAppointments = transformedData
      setAppointments([...transformedData])
      notifySubscribers()
      setError('Datele de test au fost încărcate cu succes.')
      return transformedData
    } catch (err) {
      setError('Eroare la încărcarea datelor de test: ' + err.message)
      console.error('Error populating test data:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru actualizarea cache-ului de lookup
  const updateLookupData = useCallback(async (patients = [], users = [], treatments = []) => {
    try {
      await updateLookupCache(patients, users, treatments)
    } catch (err) {
      console.error('Error updating lookup cache:', err)
    }
  }, [])

  // Funcție pentru sortarea programărilor cu prioritizare pentru optimistic updates
  const getSortedAppointments = useCallback((sortBy = 'date', sortOrder = 'asc') => {
    const baseSorted = appointmentManager.sortAppointments(sharedAppointments, sortBy, sortOrder)
    return [...baseSorted].sort((a, b) => {
      const aOpt = !!a._isOptimistic && !a._isDeleting
      const bOpt = !!b._isOptimistic && !b._isDeleting
      const aDel = !!a._isDeleting
      const bDel = !!b._isDeleting
      
      // Prioritizează optimistic updates
      if (aOpt && !bOpt) return -1
      if (!aOpt && bOpt) return 1
      
      // Pune elementele în ștergere la sfârșit
      if (aDel && !bDel) return 1
      if (!aDel && bDel) return -1
      
      return 0
    })
  }, [])

  // Încarcă datele la montarea componentei
  useEffect(() => {
    // Initialize from shared state and subscribe to updates
    setAppointments([...sharedAppointments])
    setAppointmentsCount(sharedAppointmentsCount)
    
    // Adaugă subscriber pentru actualizări
    const subscriber = (newAppointments) => {
      console.log('Appointment subscriber called with appointments count:', newAppointments.length)
      setAppointments(newAppointments)
    }
    subscribers.add(subscriber)
    const unsub = () => subscribers.delete(subscriber)
    
    // Subscribe la actualizări prin websocket
    const handler = async (message) => {
      const { type, data, resourceType } = message
      if (resourceType !== 'appointment') return
      const operation = type?.replace('resource_', '') || type
      const id = data?.id || data?.resourceId
      if (!id) return
      
      try {
        if (operation === 'created' || operation === 'create') {
          // Înlocuiește programarea optimistă cu datele reale
          const ui = appointmentManager.transformAppointmentForUI({ ...data, id, resourceId: id })
          
          // Caută în outbox pentru a găsi operația optimistă folosind ID-ul real
          const outboxEntry = await indexedDb.outboxFindByResourceId(id, 'appointment')
          
          if (outboxEntry) {
            const optimisticIndex = sharedAppointments.findIndex(a => a._tempId === outboxEntry.tempId)
            if (optimisticIndex >= 0) {
              sharedAppointments[optimisticIndex] = { ...ui, _isOptimistic: false }
            }
            await indexedDb.outboxDelete(outboxEntry.id)
          } else {
            // Dacă nu găsim în outbox, încercăm să găsim după euristică
            const optimisticIndex = sharedAppointments.findIndex(a => 
              a._isOptimistic && 
              a.patientId === data.patientId &&
              a.date === data.date &&
              a.startTime === data.startTime
            )
            if (optimisticIndex >= 0) {
              sharedAppointments[optimisticIndex] = { ...ui, _isOptimistic: false }
            } else {
              // Verifică dacă nu există deja (evită dubluri)
              const existingIndex = sharedAppointments.findIndex(a => a.id === id || a.resourceId === id)
              if (existingIndex >= 0) {
                sharedAppointments[existingIndex] = { ...ui, _isOptimistic: false }
              } else {
                // Adaugă ca nou doar dacă nu există deloc
                sharedAppointments = [{ ...ui, _isOptimistic: false }, ...sharedAppointments]
              }
            }
          }
          
          setAppointments([...sharedAppointments])
          notifySubscribers()
        } else if (operation === 'updated' || operation === 'update') {
          // Dezactivează flag-ul optimistic
          const ui = appointmentManager.transformAppointmentForUI({ ...data, id, resourceId: id })
          const existingIndex = sharedAppointments.findIndex(a => 
            a.id === id || a.resourceId === id
          )
          if (existingIndex >= 0) {
            sharedAppointments[existingIndex] = { ...ui, _isOptimistic: false }
          }
          
          setAppointments([...sharedAppointments])
          notifySubscribers()
        } else if (operation === 'deleted' || operation === 'delete') {
          // Elimină programarea din lista locală
          sharedAppointments = sharedAppointments.filter(a => {
            const matches = a.id === id || a.resourceId === id
            return !matches
          })
          setAppointments([...sharedAppointments])
          notifySubscribers()
        }
      } catch (error) {
        console.error('Error handling appointment WebSocket message:', error)
      }
    }
    
    const unsubPlural = onResourceMessage('appointments', handler)
    const unsubSingular = onResourceMessage('appointment', handler)
    
    return () => { 
      unsubPlural(); 
      unsubSingular(); 
      unsub() 
    }
  }, [])

  return {
    appointments,
    loading,
    error,
    appointmentsCount,
    loadAppointments,
    loadAppointmentsByDate,
    loadAppointmentsByWeek,
    loadAppointmentsByMonth,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    loadAppointmentsCount,
    reset,
    populateWithTestData,
    updateLookupData,
    getSortedAppointments
  }
}
