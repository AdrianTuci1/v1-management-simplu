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

    // Gestionăm atât services array (nou) cât și service (backwards compatibility)
    if (appointmentData.services && Array.isArray(appointmentData.services) && appointmentData.services.length > 0) {
      // Nou: array de servicii
      transformed.services = appointmentData.services.map(service => ({
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price
      }))
      // Pentru backwards compatibility, setăm și service cu primul serviciu
      transformed.service = {
        id: appointmentData.services[0].id,
        name: appointmentData.services[0].name,
        duration: appointmentData.services[0].duration
      }
    } else if (appointmentData.service && appointmentData.service !== '') {
      // Backwards compatibility: service singular
      const serviceObject = transformIdToObject(appointmentData.service, 'treatment')
      // Adăugăm durata dacă este disponibilă
      if (appointmentData.serviceDuration) {
        serviceObject.duration = appointmentData.serviceDuration
      }
      transformed.service = serviceObject
      // Convertim și la services array pentru consistență
      transformed.services = [serviceObject]
    }

    return transformed
  }

  // Transformare date pentru UI (Backend -> UI)
  transformAppointmentForUI(appointmentData) {
    // Extragem datele din structura nested dacă există
    const data = appointmentData.data || appointmentData
    
    // Funcție pentru formatarea datelor în format yyyy-mm-dd
    const formatDate = (date) => {
      if (!date) return ''
      try {
        const dateObj = new Date(date)
        if (isNaN(dateObj.getTime())) return ''
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      } catch (error) {
        return ''
      }
    }
    
    // Găsim ID-ul valid
    const appointmentId = appointmentData.resourceId || appointmentData.id
    
    const transformed = {
      ...appointmentData, // Preserve toate proprietățile existente, inclusiv _isOptimistic, _isDeleting, _tempId
      id: appointmentId,
      // Mapăm câmpurile pentru UI - folosim datele din nested structure dacă există, altfel din root
      date: formatDate(data.date || appointmentData.date || appointmentData.startDate || appointmentData.timestamp),
      time: data.time || appointmentData.time || '',
      appointmentDate: formatDate(data.date || appointmentData.date || appointmentData.startDate || appointmentData.timestamp),
      startTime: data.time || appointmentData.time || '',
      price: data.price?.toString() || appointmentData.price?.toString() || '',
      status: data.status || appointmentData.status || 'scheduled',
      prescription: data.prescription || appointmentData.prescription || '',
      postOperativeNotes: data.postOperativeNotes || appointmentData.postOperativeNotes || '',
      images: data.images || appointmentData.images || [],
      createdAt: data.createdAt || appointmentData.createdAt || '',
      updatedAt: data.updatedAt || appointmentData.updatedAt || ''
    }
    


    // Transformare obiecte în obiecte cu nume pentru afișare
    // Mapăm câmpurile specifice (patientName, medicName, treatmentType) la 'name' pentru consistență
    if (data.patient || appointmentData.patient) {
      const patient = data.patient || appointmentData.patient
      const patientId = transformObjectToId(patient)
      const patientName = typeof patient === 'object' && (patient.name || patient.patientName) ? 
        (patient.name || patient.patientName) : 'Pacient necunoscut'
      transformed.patient = { id: patientId || null, name: patientName }
    }

    if (data.doctor || appointmentData.doctor) {
      const doctor = data.doctor || appointmentData.doctor
      const doctorId = transformObjectToId(doctor)
      const doctorName = typeof doctor === 'object' && (doctor.name || doctor.medicName) ? 
        (doctor.name || doctor.medicName) : 'Doctor necunoscut'
      transformed.doctor = { id: doctorId || null, name: doctorName }
    }

    // Gestionăm atât services array (nou) cât și service (backwards compatibility)
    if (data.services || appointmentData.services) {
      // Nou: array de servicii
      const servicesArray = data.services || appointmentData.services
      if (Array.isArray(servicesArray)) {
        transformed.services = servicesArray.map(service => {
          const serviceId = transformObjectToId(service)
          const serviceName = typeof service === 'object' && (service.name || service.treatmentType) ? 
            (service.name || service.treatmentType) : 'Serviciu necunoscut'
          const serviceDuration = typeof service === 'object' && service.duration ? service.duration : null
          const servicePrice = typeof service === 'object' && service.price ? service.price : null
          return {
            id: serviceId || null,
            name: serviceName,
            duration: serviceDuration,
            price: servicePrice
          }
        })
        // Pentru backwards compatibility și afișare, setăm service cu primul serviciu
        if (transformed.services.length > 0) {
          transformed.service = transformed.services[0]
          transformed.treatmentType = transformed.services[0].name
          transformed.type = transformed.services[0].name
        }
      }
    } else if (data.service || appointmentData.service) {
      // Backwards compatibility: service singular
      const service = data.service || appointmentData.service
      const serviceId = transformObjectToId(service)
      const serviceName = typeof service === 'object' && (service.name || service.treatmentType) ? 
        (service.name || service.treatmentType) : 'Serviciu necunoscut'
      const serviceDuration = typeof service === 'object' && service.duration ? service.duration : null
      const servicePrice = typeof service === 'object' && service.price ? service.price : null
      transformed.service = { 
        id: serviceId || null, 
        name: serviceName,
        duration: serviceDuration,
        price: servicePrice
      }
      // Convertim și la services array pentru consistență
      transformed.services = [transformed.service]
      // Adăugăm și pentru UI
      transformed.treatmentType = serviceName
      transformed.type = serviceName
    }

    // Debug logging pentru a vedea structura transformată
    if (process.env.NODE_ENV === 'development') {
      console.log('Transformed appointment:', transformed)
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
