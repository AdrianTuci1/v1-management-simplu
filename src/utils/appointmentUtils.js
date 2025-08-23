import { indexedDb } from '../data/infrastructure/db.js'

// Utilitare pentru gestionarea programărilor

// Generează date de test pentru programări
export const generateTestAppointments = () => {
  const today = new Date()
  const appointments = []
  
  const patients = [
    'Ion Marinescu',
    'Maria Gheorghiu', 
    'Andrei Stoica',
    'Elena Radu',
    'Vasile Popescu',
    'Ana Dumitrescu'
  ]
  
  const doctors = [
    'Dr. Popescu',
    'Dr. Ionescu',
    'Dr. Vasilescu'
  ]
  
  const services = [
    'Control de rutină',
    'Obturație',
    'Detartraj',
    'Extracție molar',
    'Canal radicular',
    'Proteză'
  ]
  
  const statuses = ['scheduled', 'in-progress', 'completed', 'urgent']
  
  // Generează programări pentru următoarele 7 zile
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    
    // 2-4 programări per zi
    const appointmentsPerDay = Math.floor(Math.random() * 3) + 2
    
    for (let j = 0; j < appointmentsPerDay; j++) {
      const hour = 9 + Math.floor(Math.random() * 8) // 9:00 - 17:00
      const minute = Math.floor(Math.random() * 4) * 15 // 00, 15, 30, 45
      
      appointments.push({
        id: `app_${Date.now()}_${i}_${j}`,
        patient: patients[Math.floor(Math.random() * patients.length)],
        doctor: doctors[Math.floor(Math.random() * doctors.length)],
        date: date.toISOString(),
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        service: services[Math.floor(Math.random() * services.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        price: Math.floor(Math.random() * 500) + 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
  }
  
  return appointments
}

// Populează cache-ul local cu date de test
export const populateTestData = async () => {
  try {
    const testAppointments = generateTestAppointments()
    await indexedDb.bulkPut('appointments', testAppointments)
    
    // Actualizează și cache-ul pentru numărul de programări
    const appointmentsByDate = {}
    testAppointments.forEach(appointment => {
      const dateKey = new Date(appointment.date).toISOString().split('T')[0]
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = 0
      }
      appointmentsByDate[dateKey]++
    })
    
    for (const [dateKey, count] of Object.entries(appointmentsByDate)) {
      await indexedDb.setAppointmentCount(new Date(dateKey), count)
    }
    
    console.log('Test data populated successfully')
    return testAppointments
  } catch (error) {
    console.error('Error populating test data:', error)
    throw error
  }
}

// Curăță toate datele din cache
export const clearAllData = async () => {
  try {
    await indexedDb.clear('appointments')
    await indexedDb.clear('appointmentCounts')
    console.log('All data cleared successfully')
  } catch (error) {
    console.error('Error clearing data:', error)
    throw error
  }
}

// Verifică starea cache-ului
export const checkCacheStatus = async () => {
  try {
    const appointments = await indexedDb.getAll('appointments')
    const counts = await indexedDb.getAll('appointmentCounts')
    
    return {
      appointmentsCount: appointments.length,
      appointmentCountsCount: counts.length,
      hasData: appointments.length > 0
    }
  } catch (error) {
    console.error('Error checking cache status:', error)
    return {
      appointmentsCount: 0,
      appointmentCountsCount: 0,
      hasData: false,
      error: error.message
    }
  }
}

// Exportă datele din cache
export const exportCacheData = async () => {
  try {
    const appointments = await indexedDb.getAll('appointments')
    const counts = await indexedDb.getAll('appointmentCounts')
    
    return {
      appointments,
      appointmentCounts: counts,
      exportDate: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error exporting cache data:', error)
    throw error
  }
}

// Importă date în cache
export const importCacheData = async (data) => {
  try {
    if (data.appointments && data.appointments.length > 0) {
      await indexedDb.bulkPut('appointments', data.appointments)
    }
    
    if (data.appointmentCounts && data.appointmentCounts.length > 0) {
      await indexedDb.bulkPut('appointmentCounts', data.appointmentCounts)
    }
    
    console.log('Data imported successfully')
  } catch (error) {
    console.error('Error importing data:', error)
    throw error
  }
}
