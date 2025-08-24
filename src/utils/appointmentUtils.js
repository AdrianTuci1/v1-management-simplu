import { indexedDb } from '../data/infrastructure/db.js'

// Utilitare pentru gestionarea programărilor

// Cache pentru datele de lookup
let patientsCache = []
let usersCache = []
let treatmentsCache = []

// Funcție pentru actualizarea cache-ului cu date externe
export const updateLookupCache = async (patients = [], users = [], treatments = []) => {
  try {
    patientsCache = patients || []
    usersCache = users || []
    treatmentsCache = treatments || []
    // Debug log pentru development
    if (process.env.NODE_ENV === 'development') {
      console.log('Cache updated:', { 
        patientsCount: patientsCache.length, 
        usersCount: usersCache.length, 
        treatmentsCount: treatmentsCache.length 
      })
    }
  } catch (error) {
    console.error('Error updating lookup cache:', error)
  }
}

// Funcție pentru transformarea ID-ului în obiect cu date reale
export const transformIdToObject = (id, type) => {
  // Dacă deja este un obiect, îl returnăm
  if (typeof id === 'object' && id !== null) {
    return id
  }

  // Dacă ID-ul este null sau undefined, returnăm un obiect cu valori implicite
  if (id === null || id === undefined || id === '') {
    switch (type) {
      case 'patient':
        return { id: null, name: 'Pacient necunoscut' }
      case 'doctor':
        return { id: null, name: 'Doctor necunoscut' }
      case 'treatment':
        return { id: null, name: 'Serviciu necunoscut' }
      default:
        return { id: null, name: 'Necunoscut' }
    }
  }

  // Pentru ID-uri string, încercăm să le parsezăm ca numere, dar păstrăm string-ul original dacă nu este valid
  let objectId = id
  if (typeof id === 'string') {
    const parsedId = parseInt(id, 10)
    // Folosim parsedId doar dacă este un număr valid (nu NaN)
    objectId = isNaN(parsedId) ? id : parsedId
  }

  switch (type) {
    case 'patient':
      // Căutăm atât după ID numeric cât și după ID string
      const patient = patientsCache.find(p => 
        p.id === objectId || 
        p.id?.toString() === objectId?.toString() ||
        p.resourceId === objectId ||
        p.resourceId?.toString() === objectId?.toString()
      )
      if (process.env.NODE_ENV === 'development') {
        console.log(`Looking for patient with ID: ${objectId}, found:`, patient)
      }
      return patient ? { id: patient.id || patient.resourceId, name: patient.patientName || patient.name } : { id: objectId, name: `Patient ${objectId}` }
    
    case 'doctor':
      const doctor = usersCache.find(u => 
        u.id === objectId || 
        u.id?.toString() === objectId?.toString() ||
        u.resourceId === objectId ||
        u.resourceId?.toString() === objectId?.toString()
      )
      if (process.env.NODE_ENV === 'development') {
        console.log(`Looking for doctor with ID: ${objectId}, found:`, doctor)
      }
      return doctor ? { id: doctor.id || doctor.resourceId, name: doctor.medicName || doctor.name } : { id: objectId, name: `Doctor ${objectId}` }
    
    case 'treatment':
      const treatment = treatmentsCache.find(t => 
        t.id === objectId || 
        t.id?.toString() === objectId?.toString() ||
        t.resourceId === objectId ||
        t.resourceId?.toString() === objectId?.toString()
      )
      if (process.env.NODE_ENV === 'development') {
        console.log(`Looking for treatment with ID: ${objectId}, found:`, treatment)
      }
      return treatment ? { 
        id: treatment.resourceId || treatment.id, 
        name: treatment.treatmentType || treatment.name || `Treatment ${treatment.resourceId || treatment.id}` 
      } : { id: objectId, name: `Treatment ${objectId}` }
    
    default:
      return { id: objectId, name: `Unknown ${objectId}` }
  }
}

// Funcție pentru transformarea obiectului în ID
export const transformObjectToId = (obj) => {
  // Dacă este deja un ID (string sau număr), îl returnăm
  if (typeof obj === 'string' || typeof obj === 'number') {
    return obj.toString()
  }

  // Dacă este un obiect cu id sau resourceId, returnăm id-ul ca string
  if (obj && typeof obj === 'object') {
    if (obj.id !== undefined && obj.id !== null) {
      return obj.id.toString()
    }
    if (obj.resourceId !== undefined && obj.resourceId !== null) {
      return obj.resourceId.toString()
    }
  }

  // Fallback pentru cazul când id-ul este null sau undefined
  return ''
}

// Funcție pentru validarea câmpurilor esențiale
export const validateAppointmentFields = (appointmentData) => {
  const errors = []

  if (!appointmentData.patient) {
    errors.push('Pacientul este obligatoriu')
  }

  if (!appointmentData.doctor) {
    errors.push('Doctorul este obligatoriu')
  }

  if (!appointmentData.date) {
    errors.push('Data este obligatorie')
  } else {
    const selectedDate = new Date(appointmentData.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      errors.push('Data nu poate fi în trecut')
    }
  }

  if (!appointmentData.time) {
    errors.push('Ora este obligatorie')
  }

  if (!appointmentData.service) {
    errors.push('Serviciul este obligatoriu')
  }

  // Validare format date
  if (appointmentData.price && isNaN(parseFloat(appointmentData.price))) {
    errors.push('Prețul trebuie să fie un număr valid')
  }

  return errors
}

// Funcție pentru popularea datelor de test
export const populateTestData = async () => {
  const { indexedDb } = await import('../data/infrastructure/db.js')
  
  const testAppointments = [
    {
      id: 1,
      patient: { id: 1, name: 'Ion Popescu' },
      doctor: { id: 1, name: 'Dr. Maria Ionescu' },
      date: '2024-01-15',
      time: '09:00',
      service: { id: 1, name: 'Consultatie generala' },
      status: 'completed',
      postOperativeNotes: 'Pacientul a răspuns bine la tratament',
      prescription: 'Paracetamol 500mg, 3x pe zi',
      price: 150,
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-15T09:30:00Z'
    },
    {
      id: 2,
      patient: { id: 2, name: 'Ana Dumitrescu' },
      doctor: { id: 2, name: 'Dr. Alexandru Popa' },
      date: '2024-01-16',
      time: '14:30',
      service: { id: 2, name: 'Extractie masea' },
      status: 'scheduled',
      postOperativeNotes: '',
      prescription: '',
      price: 300,
      createdAt: '2024-01-12T10:00:00Z',
      updatedAt: '2024-01-12T10:00:00Z'
    },
    {
      id: 3,
      patient: { id: 3, name: 'Mihai Vasilescu' },
      doctor: { id: 1, name: 'Dr. Maria Ionescu' },
      date: '2024-01-17',
      time: '11:00',
      service: { id: 3, name: 'Canal radicular' },
      status: 'in-progress',
      postOperativeNotes: 'Procedura în curs',
      prescription: 'Ibuprofen 400mg, 2x pe zi',
      price: 450,
      createdAt: '2024-01-13T15:30:00Z',
      updatedAt: '2024-01-17T11:15:00Z'
    }
  ]

  // Ștergem datele existente
  await indexedDb.clear('appointments')
  
  // Adăugăm datele de test
  for (const appointment of testAppointments) {
    await indexedDb.add('appointments', appointment)
  }
}

// Funcție pentru verificarea statusului cache-ului
export const checkCacheStatus = async () => {
  const { indexedDb } = await import('../data/infrastructure/db.js')
  
  try {
    const appointments = await indexedDb.getAll('appointments')
    return {
      hasData: appointments.length > 0,
      count: appointments.length,
      lastUpdate: new Date().toISOString()
    }
  } catch (error) {
    return {
      hasData: false,
      count: 0,
      error: error.message
    }
  }
}
