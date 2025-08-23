import { useState, useCallback } from 'react'
import appointmentService from '../services/appointmentService.js'
import { indexedDb } from '../data/infrastructure/db.js'
import { populateTestData, checkCacheStatus } from '../utils/appointmentUtils.js'

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [appointmentsCount, setAppointmentsCount] = useState({})

  // Funcție pentru încărcarea programărilor cu gestionarea erorilor
  const loadAppointments = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await appointmentService.getAppointments(params)
      setAppointments(data)
      return data
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
          setAppointments(testData)
          setError('Conectare la server eșuată. Se afișează datele de test din cache local.')
          return testData
        }
        
        setAppointments(cachedData)
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        return cachedData
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
      setAppointments(data)
      return data
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
      setAppointments(data)
      return data
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
        setAppointments(cachedData)
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        return cachedData
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
      setAppointments(data)
      return data
    } catch (err) {
      // Încearcă să încarce din cache local dacă API-ul eșuează
      try {
        console.warn('API failed for month view, trying local cache:', err.message)
        const startOfMonth = new Date(year, month, 1)
        const endOfMonth = new Date(year, month + 1, 0)
        endOfMonth.setHours(23, 59, 59, 999)

        const cachedData = await indexedDb.getAppointmentsByDateRange(startOfMonth, endOfMonth)
        setAppointments(cachedData)
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        return cachedData
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error loading appointments by month:', err)
        return []
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru adăugarea unei programări
  const addAppointment = useCallback(async (appointmentData) => {
    setLoading(true)
    setError(null)
    
    try {
      const newAppointment = await appointmentService.addAppointment(appointmentData)
      setAppointments(prev => [...prev, newAppointment])
      return newAppointment
    } catch (err) {
      setError(err.message)
      console.error('Error adding appointment:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru actualizarea unei programări
  const updateAppointment = useCallback(async (id, appointmentData) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedAppointment = await appointmentService.updateAppointment(id, appointmentData)
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? updatedAppointment : appointment
        )
      )
      return updatedAppointment
    } catch (err) {
      setError(err.message)
      console.error('Error updating appointment:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru ștergerea unei programări
  const deleteAppointment = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      await appointmentService.deleteAppointment(id)
      setAppointments(prev => prev.filter(appointment => appointment.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error deleting appointment:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Funcție pentru încărcarea numărului de programări pentru mai multe date
  const loadAppointmentsCount = useCallback(async (dates) => {
    try {
      const counts = {}
      for (const date of dates) {
        const count = await appointmentService.getAppointmentsCount(date)
        counts[date.toISOString().split('T')[0]] = count
      }
      setAppointmentsCount(counts)
      return counts
    } catch (err) {
      // Fallback la cache local pentru numărul de programări
      try {
        console.warn('API failed for appointment counts, using local cache')
        const counts = {}
        for (const date of dates) {
          const count = await indexedDb.getAppointmentCount(date)
          counts[date.toISOString().split('T')[0]] = count
        }
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
    setAppointments([])
    setLoading(false)
    setError(null)
    setAppointmentsCount({})
  }, [])

  // Funcție pentru popularea datelor de test
  const populateWithTestData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      await populateTestData()
      const testData = await indexedDb.getAll('appointments')
      setAppointments(testData)
      setError('Datele de test au fost încărcate cu succes.')
      return testData
    } catch (err) {
      setError('Eroare la încărcarea datelor de test: ' + err.message)
      console.error('Error populating test data:', err)
      return []
    } finally {
      setLoading(false)
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
    populateWithTestData
  }
}
