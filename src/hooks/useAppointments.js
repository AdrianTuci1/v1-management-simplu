import { useState, useCallback, useEffect } from 'react'
import appointmentService from '../services/appointmentService.js'
import { indexedDb } from '../data/infrastructure/db.js'
import { onResourceMessage } from '../data/infrastructure/websocketClient.js'
import { populateTestData, checkCacheStatus, updateLookupCache } from '../utils/appointmentUtils.js'
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

  // Funcție pentru adăugarea unei programări cu optimistic update
  const addAppointment = useCallback(async (appointmentData) => {
    setError(null)
    
    // Validare
    appointmentManager.validateAppointment(appointmentData)
    
    // Transformare pentru API
    const apiData = appointmentManager.transformAppointmentForAPI(appointmentData)
    
    // Generare ID temporar pentru optimistic update
    const tempId = generateTempId()
    const optimisticAppointment = {
      ...appointmentManager.transformAppointmentForUI(apiData),
      _tempId: tempId,
      _isOptimistic: true,
      id: tempId // Folosim tempId ca ID pentru optimistic update
    }
    
    // Adaugă programarea optimistă în shared state
    sharedAppointments = [optimisticAppointment, ...sharedAppointments]
    setAppointments([...sharedAppointments])
    notifySubscribers()
    
    try {
      const newAppointment = await appointmentService.addAppointment(apiData)
      return newAppointment
    } catch (err) {
      // În caz de eroare, elimină programarea optimistă
      sharedAppointments = sharedAppointments.filter(a => a._tempId !== tempId)
      setAppointments([...sharedAppointments])
      notifySubscribers()
      
      setError(err.message)
      console.error('Error adding appointment:', err)
      throw err
    }
  }, [])

  // Funcție pentru actualizarea unei programări cu optimistic update
  const updateAppointment = useCallback(async (id, appointmentData) => {
    setError(null)
    
    // Verifică dacă ID-ul este valid
    if (!id) {
      throw new Error('Appointment ID is required for update')
    }
    
    // Validare
    appointmentManager.validateAppointment(appointmentData)
    
    // Transformare pentru API
    const apiData = appointmentManager.transformAppointmentForAPI(appointmentData)
    
    // Găsește programarea existentă
    const existingAppointment = sharedAppointments.find(a => a.id === id || a.resourceId === id)
    if (!existingAppointment) {
      throw new Error('Appointment not found')
    }
    
    // Creează versiunea optimistă
    const optimisticAppointment = {
      ...existingAppointment,
      ...appointmentManager.transformAppointmentForUI(apiData),
      _isOptimistic: true
    }
    
    // Actualizează programarea optimistă în shared state
    sharedAppointments = sharedAppointments.map(a => 
      (a.id === id || a.resourceId === id) ? optimisticAppointment : a
    )
    setAppointments([...sharedAppointments])
    notifySubscribers()
    
    try {
      const updatedAppointment = await appointmentService.updateAppointment(id, apiData)
      return updatedAppointment
    } catch (err) {
      // În caz de eroare, restaurează programarea originală
      sharedAppointments = sharedAppointments.map(a => 
        (a.id === id || a.resourceId === id) ? existingAppointment : a
      )
      setAppointments([...sharedAppointments])
      notifySubscribers()
      
      setError(err.message)
      console.error('Error updating appointment:', err)
      throw err
    }
  }, [])

  // Funcție pentru ștergerea unei programări cu optimistic update
  const deleteAppointment = useCallback(async (id) => {
    setError(null)
    
    // Verifică dacă ID-ul este valid
    if (!id) {
      throw new Error('Appointment ID is required for deletion')
    }
    
    // Găsește programarea existentă
    const existingAppointment = sharedAppointments.find(a => a.id === id || a.resourceId === id)
    if (!existingAppointment) {
      throw new Error('Appointment not found')
    }
    
    // Marchează programarea ca fiind ștearsă optimist
    const optimisticAppointment = {
      ...existingAppointment,
      _isOptimistic: true,
      _isDeleting: true
    }
    
    // Actualizează programarea optimistă în shared state
    sharedAppointments = sharedAppointments.map(a => 
      (a.id === id || a.resourceId === id) ? optimisticAppointment : a
    )
    setAppointments([...sharedAppointments])
    notifySubscribers()
    
    try {
      await appointmentService.deleteAppointment(id)
    } catch (err) {
      // În caz de eroare, restaurează programarea originală
      sharedAppointments = sharedAppointments.map(a => 
        (a.id === id || a.resourceId === id) ? existingAppointment : a
      )
      setAppointments([...sharedAppointments])
      notifySubscribers()
      
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
      
      console.log('WebSocket message received:', { type, resourceType, data })
      
      // Verifică dacă este pentru programări
      if (resourceType !== 'appointment') return
      
      // Extrage operația din tipul mesajului
      const operation = type?.replace('resource_', '') || 'unknown'
      const appointmentId = data?.id
      
      console.log('Processing appointment operation:', { operation, appointmentId })
      
      if (!appointmentId) return
      
      // Procesează operația
      if (operation === 'created') {
        console.log('Before transformAppointmentForUI - data:', { ...data, id: appointmentId, resourceId: appointmentId })
        const ui = appointmentManager.transformAppointmentForUI({ ...data, id: appointmentId, resourceId: appointmentId })
        console.log('After transformAppointmentForUI - ui:', ui)
        
        // Actualizează IndexedDB cu datele reale - asigură-te că resourceId este setat
        const dataForIndexedDB = { 
          ...data, 
          id: appointmentId, 
          resourceId: appointmentId, 
          _isOptimistic: false 
        }
        await indexedDb.put('appointments', dataForIndexedDB)
        
        // Caută în outbox pentru a găsi operația optimistă
        const outboxEntry = await indexedDb.outboxFindByResourceId(appointmentId, 'appointments')
        
        if (outboxEntry) {
          console.log('Found outbox entry:', outboxEntry)
          // Găsește programarea optimistă în shared state prin tempId
          const optimisticIndex = sharedAppointments.findIndex(a => a._tempId === outboxEntry.tempId)
          console.log('Looking for tempId:', outboxEntry.tempId, 'Found at index:', optimisticIndex)
          
          if (optimisticIndex >= 0) {
            console.log('Before replacement - appointment:', sharedAppointments[optimisticIndex])
            // Înlocuiește programarea optimistă cu datele reale
            sharedAppointments[optimisticIndex] = { ...ui, _isOptimistic: false }
            console.log('After replacement - appointment:', sharedAppointments[optimisticIndex])
            console.log('Replaced optimistic appointment with real data from outbox')
          }
          
          // Șterge din outbox
          await indexedDb.outboxDelete(outboxEntry.id)
        } else {
          // Dacă nu găsește în outbox, caută prin ID normal
          const existingIndex = sharedAppointments.findIndex(a => a.id === appointmentId || a.resourceId === appointmentId)
          
          if (existingIndex >= 0) {
            // Actualizează programarea existentă
            sharedAppointments[existingIndex] = { ...ui, _isOptimistic: false }
          } else {
            // Adaugă programarea nouă
            sharedAppointments = [{ ...ui, _isOptimistic: false }, ...sharedAppointments]
          }
        }
        
        // Actualizează starea locală și notifică toți subscriberii
        console.log('Updating appointments state after CREATED operation. Current count:', sharedAppointments.length)
        setAppointments([...sharedAppointments])
        notifySubscribers()
        
      } else if (operation === 'updated') {
        console.log('Before transformAppointmentForUI (updated) - data:', { ...data, id: appointmentId, resourceId: appointmentId })
        const ui = appointmentManager.transformAppointmentForUI({ ...data, id: appointmentId, resourceId: appointmentId })
        console.log('After transformAppointmentForUI (updated) - ui:', ui)
        
        // Actualizează IndexedDB cu datele reale - asigură-te că resourceId este setat
        const dataForIndexedDB = { 
          ...data, 
          id: appointmentId, 
          resourceId: appointmentId, 
          _isOptimistic: false 
        }
        await indexedDb.put('appointments', dataForIndexedDB)
        
        // Caută programarea în shared state și dezactivează _isOptimistic
        const existingIndex = sharedAppointments.findIndex(a => a.id === appointmentId || a.resourceId === appointmentId)
        console.log('Looking for appointment with id/resourceId:', appointmentId, 'Found at index:', existingIndex)
        
        if (existingIndex >= 0) {
          console.log('Before update - appointment:', sharedAppointments[existingIndex])
          // Actualizează programarea existentă și dezactivează optimistic flag
          sharedAppointments[existingIndex] = { ...ui, _isOptimistic: false }
          console.log('After update - appointment:', sharedAppointments[existingIndex])
          console.log('Updated appointment and disabled optimistic flag')
        } else {
          // Adaugă programarea nouă dacă nu există
          sharedAppointments = [{ ...ui, _isOptimistic: false }, ...sharedAppointments]
        }
        
        // Actualizează starea locală și notifică toți subscriberii
        console.log('Updating appointments state after UPDATED operation. Current count:', sharedAppointments.length)
        setAppointments([...sharedAppointments])
        notifySubscribers()
        
      } else if (operation === 'deleted') {
        // Șterge din IndexedDB
        await indexedDb.delete('appointments', appointmentId)
        
        // Șterge din shared state și dezactivează _isOptimistic
        sharedAppointments = sharedAppointments.filter(a => {
          const matches = a.id === appointmentId || a.resourceId === appointmentId
          if (matches && a._isOptimistic) {
            console.log('Removed optimistic appointment after deletion confirmation')
          }
          return !matches
        })
        
        // Actualizează starea locală și notifică toți subscriberii
        console.log('Updating appointments state after DELETED operation. Current count:', sharedAppointments.length)
        setAppointments([...sharedAppointments])
        notifySubscribers()
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
