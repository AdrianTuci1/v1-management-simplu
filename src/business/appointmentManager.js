import appointmentService from '../services/appointmentService.js'
import { 
  transformIdToObject, 
  transformObjectToId, 
  validateAppointmentFields,
  updateLookupCache 
} from '../utils/appointmentUtils.js'

class AppointmentManager {
  // Validare pentru o programare
  validateAppointment(appointmentData) {
    const errors = validateAppointmentFields(appointmentData)
    
    if (errors.length > 0) {
      throw new Error(errors.join(', '))
    }

    return true
  }

  // Transformare date pentru API (UI -> Backend)
  transformAppointmentForAPI(appointmentData) {
    // Funcție pentru formatarea datelor în format yyyy-mm-dd
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const transformed = {
      ...appointmentData,
      date: formatDate(new Date(appointmentData.date)),
      time: appointmentData.time,
      price: parseFloat(appointmentData.price) || 0,
      status: appointmentData.status || 'scheduled',
      createdAt: appointmentData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Transformare ID-uri în obiecte pentru backend
    if (appointmentData.patient && appointmentData.patient !== '') {
      transformed.patient = transformIdToObject(appointmentData.patient, 'patient')
    }

    if (appointmentData.doctor && appointmentData.doctor !== '') {
      transformed.doctor = transformIdToObject(appointmentData.doctor, 'doctor')
    }

    if (appointmentData.service && appointmentData.service !== '') {
      const serviceObject = transformIdToObject(appointmentData.service, 'treatment')
      // Adăugăm durata dacă este disponibilă
      if (appointmentData.serviceDuration) {
        serviceObject.duration = appointmentData.serviceDuration
      }
      transformed.service = serviceObject
    }

    return transformed
  }

  // Transformare date pentru UI (Backend -> UI)
  transformAppointmentForUI(appointmentData) {

    
    // Extragem datele din structura nested dacă există
    const data = appointmentData.data || appointmentData
    
    // Funcție pentru formatarea datelor în format yyyy-mm-dd
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // Găsim ID-ul valid
    const appointmentId = appointmentData.resourceId || appointmentData.id
    
    const transformed = {
      ...appointmentData, // Preserve toate proprietățile existente, inclusiv _isOptimistic, _isDeleting, _tempId
      id: appointmentId,
      date: data.date ? formatDate(new Date(data.date)) : '',
      time: data.time || '',
      price: data.price?.toString() || '',
      status: data.status || 'scheduled',
      prescription: data.prescription || '',
      postOperativeNotes: data.postOperativeNotes || '',
      images: data.images || [],
      createdAt: data.createdAt || '',
      updatedAt: data.updatedAt || ''
    }
    


    // Transformare obiecte în obiecte cu nume pentru afișare
    if (data.patient) {
      const patientId = transformObjectToId(data.patient)
      const patientName = typeof data.patient === 'object' && data.patient.name ? data.patient.name : 'Pacient necunoscut'
      transformed.patient = { id: patientId || null, name: patientName }
    }

    if (data.doctor) {
      const doctorId = transformObjectToId(data.doctor)
      const doctorName = typeof data.doctor === 'object' && data.doctor.name ? data.doctor.name : 'Doctor necunoscut'
      transformed.doctor = { id: doctorId || null, name: doctorName }
    }

    if (data.service) {
      const serviceId = transformObjectToId(data.service)
      const serviceName = typeof data.service === 'object' && (data.service.name || data.service.treatmentType) ? 
        (data.service.name || data.service.treatmentType) : 'Serviciu necunoscut'
      const serviceDuration = typeof data.service === 'object' && data.service.duration ? data.service.duration : null
      transformed.service = { 
        id: serviceId || null, 
        name: serviceName,
        duration: serviceDuration
      }
    }

    return transformed
  }

  // Inițializare cache la pornirea aplicației
  async initializeCache() {
    await updateLookupCache()
  }

  // Verificare conflict programări
  async checkConflicts(appointmentData, excludeId = null) {
    try {
      const date = new Date(appointmentData.date)
      const appointments = await appointmentService.getAppointmentsByDate(date)
      
      const conflictingAppointments = appointments.filter(appointment => {
        if (excludeId && appointment.id === excludeId) return false
        
        // Verifică dacă există suprapunere de timp
        const appointmentTime = appointment.time
        const newTime = appointmentData.time
        
        // Simplificat: verifică dacă ora este exactă (poate fi îmbunătățit pentru intervale)
        return appointmentTime === newTime && appointment.doctor === appointmentData.doctor
      })

      return conflictingAppointments.length > 0
    } catch (error) {
      console.error('Error checking conflicts:', error)
      return false
    }
  }

  // Obține statistici pentru o perioadă
  async getStatistics(startDate, endDate) {
    try {
      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
      
      const appointments = await appointmentService.getAppointments(params)
      
      const stats = {
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'completed').length,
        inProgress: appointments.filter(a => a.status === 'in-progress').length,
        scheduled: appointments.filter(a => a.status === 'scheduled').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        urgent: appointments.filter(a => a.status === 'urgent').length,
        totalRevenue: appointments
          .filter(a => a.status === 'completed')
          .reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0)
      }

      return stats
    } catch (error) {
      console.error('Error getting statistics:', error)
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        scheduled: 0,
        cancelled: 0,
        urgent: 0,
        totalRevenue: 0
      }
    }
  }

  // Filtrare programări
  filterAppointments(appointments, filters = {}) {
    let filtered = [...appointments]

    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status)
    }

    if (filters.doctor) {
      filtered = filtered.filter(a => {
        const doctorId = transformObjectToId(a.doctor)
        return doctorId === filters.doctor
      })
    }

    if (filters.patient) {
      filtered = filtered.filter(a => {
        const patientId = transformObjectToId(a.patient)
        return patientId === filters.patient
      })
    }

    if (filters.service) {
      filtered = filtered.filter(a => {
        const serviceId = transformObjectToId(a.service)
        return serviceId === filters.service
      })
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filtered = filtered.filter(a => {
        const appointmentDate = new Date(a.date)
        return appointmentDate >= start && appointmentDate <= end
      })
    }

    return filtered
  }

  // Sortare programări
  sortAppointments(appointments, sortBy = 'date', sortOrder = 'asc') {
    const sorted = [...appointments]

    sorted.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
        case 'time':
          aValue = a.time
          bValue = b.time
          break
        case 'patient':
          aValue = transformObjectToId(a.patient)
          bValue = transformObjectToId(b.patient)
          break
        case 'doctor':
          aValue = transformObjectToId(a.doctor)
          bValue = transformObjectToId(b.doctor)
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'price':
          aValue = parseFloat(a.price) || 0
          bValue = parseFloat(b.price) || 0
          break
        default:
          aValue = new Date(a.date)
          bValue = new Date(b.date)
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return sorted
  }

  // Export programări
  exportAppointments(appointments, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(appointments, null, 2)
      
      case 'csv':
        const headers = ['Data', 'Ora', 'Pacient', 'Doctor', 'Serviciu', 'Status', 'Preț']
        const rows = appointments.map(a => [
          new Date(a.date).toLocaleDateString('ro-RO'),
          a.time,
          transformObjectToId(a.patient),
          transformObjectToId(a.doctor),
          transformObjectToId(a.service),
          a.status,
          a.price
        ])
        
        return [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n')
      
      default:
        throw new Error(`Format necunoscut: ${format}`)
    }
  }
}

export default new AppointmentManager()
