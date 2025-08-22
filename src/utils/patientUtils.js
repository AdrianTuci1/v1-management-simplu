import { indexedDb } from '../data/infrastructure/db.js'

// Utilitare pentru gestionarea pacienților

// Generează date de test pentru pacienți
export const generateTestPatients = () => {
  const patients = []
  
  const names = [
    'Ion Marinescu',
    'Maria Gheorghiu', 
    'Andrei Stoica',
    'Elena Radu',
    'Vasile Popescu',
    'Ana Dumitrescu',
    'Mihai Ionescu',
    'Carmen Vasilescu',
    'Alexandru Munteanu',
    'Diana Olteanu',
    'Cristian Neagu',
    'Laura Stanciu',
    'Bogdan Tudor',
    'Roxana Marin',
    'Florin Dobre',
    'Simona Călinescu',
    'Adrian Mocanu',
    'Gabriela Lupu',
    'Victor Cojocaru',
    'Monica Enache'
  ]
  
  const cities = [
    'București',
    'Cluj-Napoca',
    'Timișoara',
    'Iași',
    'Constanța',
    'Craiova',
    'Brașov',
    'Galați',
    'Ploiești',
    'Oradea'
  ]
  
  const counties = [
    'București',
    'Cluj',
    'Timiș',
    'Iași',
    'Constanța',
    'Dolj',
    'Brașov',
    'Galați',
    'Prahova',
    'Bihor'
  ]
  
  const insuranceProviders = [
    'Casa Națională de Asigurări de Sănătate',
    'MedLife',
    'Sanador',
    'Regina Maria',
    'Medicover',
    'Allianz Țiriac',
    'Groupama',
    'Generali',
    null
  ]
  
  const statuses = ['active', 'inactive', 'archived']
  
  // Generează pacienți
  for (let i = 0; i < 50; i++) {
    const name = names[Math.floor(Math.random() * names.length)]
    const city = cities[Math.floor(Math.random() * cities.length)]
    const county = counties[Math.floor(Math.random() * counties.length)]
    const insuranceProvider = insuranceProviders[Math.floor(Math.random() * insuranceProviders.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    // Generează data nașterii între 18 și 80 de ani
    const birthYear = 1944 + Math.floor(Math.random() * 62)
    const birthMonth = Math.floor(Math.random() * 12)
    const birthDay = Math.floor(Math.random() * 28) + 1
    const birthDate = new Date(birthYear, birthMonth, birthDay)
    
    // Generează CNP
    const cnp = generateCNP(birthDate, Math.random() > 0.5 ? 'M' : 'F')
    
    // Generează email
    const email = generateEmail(name)
    
    // Generează telefon
    const phone = generatePhone()
    
    // Generează adresa
    const address = generateAddress()
    
    // Generează cod poștal
    const postalCode = generatePostalCode()
    
    // Generează contact de urgență
    const emergencyContact = names[Math.floor(Math.random() * names.length)]
    const emergencyPhone = generatePhone()
    
    // Generează istoric medical
    const medicalHistory = generateMedicalHistory()
    
    // Generează alergii
    const allergies = generateAllergies()
    
    // Generează medicamente
    const medications = generateMedications()
    
    // Generează note
    const notes = generateNotes()
    
    // Generează data creării (ultimele 2 ani)
    const createdAt = new Date()
    createdAt.setFullYear(createdAt.getFullYear() - Math.floor(Math.random() * 2))
    createdAt.setMonth(Math.floor(Math.random() * 12))
    createdAt.setDate(Math.floor(Math.random() * 28) + 1)
    
    patients.push({
      id: `patient_${Date.now()}_${i}`,
      name,
      email,
      phone,
      birthDate: birthDate.toISOString(),
      cnp,
      address,
      city,
      county,
      postalCode,
      emergencyContact,
      emergencyPhone,
      medicalHistory,
      allergies,
      medications,
      insuranceProvider,
      insuranceNumber: insuranceProvider ? generateInsuranceNumber() : null,
      status,
      notes,
      createdAt: createdAt.toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
  
  return patients
}

// Generează CNP valid
function generateCNP(birthDate, gender) {
  const year = birthDate.getFullYear() % 100
  const month = birthDate.getMonth() + 1
  const day = birthDate.getDate()
  
  // Codul județului (01-52)
  const county = Math.floor(Math.random() * 52) + 1
  
  // Codul de gen și secol
  const genderCode = gender === 'M' ? 
    (year < 50 ? 1 : 5) : 
    (year < 50 ? 2 : 6)
  
  // Numărul de ordine (001-999)
  const order = Math.floor(Math.random() * 999) + 1
  
  // Construiește CNP-ul fără cifra de control
  const cnpWithoutControl = `${genderCode}${year.toString().padStart(2, '0')}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}${county.toString().padStart(2, '0')}${order.toString().padStart(3, '0')}`
  
  // Calculează cifra de control
  const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9]
  let sum = 0
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpWithoutControl[i]) * weights[i]
  }
  
  const controlDigit = sum % 11
  const finalControlDigit = controlDigit === 10 ? 1 : controlDigit
  
  return cnpWithoutControl + finalControlDigit
}

// Generează email
function generateEmail(name) {
  const nameParts = name.toLowerCase().split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts[nameParts.length - 1]
  
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  
  const emailVariants = [
    `${firstName}.${lastName}@${domain}`,
    `${firstName}${lastName}@${domain}`,
    `${firstName[0]}${lastName}@${domain}`,
    `${firstName}_${lastName}@${domain}`,
    `${firstName}${Math.floor(Math.random() * 999)}@${domain}`
  ]
  
  return emailVariants[Math.floor(Math.random() * emailVariants.length)]
}

// Generează telefon
function generatePhone() {
  const prefixes = ['021', '022', '023', '024', '025', '026', '027', '028', '029', '031', '032', '033', '034', '035', '036', '037', '038', '039']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(Math.random() * 9999999) + 1000000
  
  return `${prefix}${number}`
}

// Generează adresa
function generateAddress() {
  const streets = [
    'Strada Florilor',
    'Bulevardul Unirii',
    'Strada Libertății',
    'Calea Victoriei',
    'Strada Republicii',
    'Bulevardul Nicolae Bălcescu',
    'Strada Mihai Eminescu',
    'Calea Dorobanților',
    'Strada Ion Creangă',
    'Bulevardul Magheru'
  ]
  
  const street = streets[Math.floor(Math.random() * streets.length)]
  const number = Math.floor(Math.random() * 200) + 1
  const apartment = Math.floor(Math.random() * 50) + 1
  
  return `${street}, Nr. ${number}, Ap. ${apartment}`
}

// Generează cod poștal
function generatePostalCode() {
  return Math.floor(Math.random() * 900000) + 100000
}

// Generează număr asigurare
function generateInsuranceNumber() {
  return `ASIG${Math.floor(Math.random() * 999999) + 100000}`
}

// Generează istoric medical
function generateMedicalHistory() {
  const conditions = [
    'Hipertensiune arterială',
    'Diabet zaharat tip 2',
    'Astm bronșic',
    'Cardiopatie ischemică',
    'Gastrită cronică',
    'Artrită reumatoidă',
    'Hipotiroidism',
    'Hipercolesterolemie',
    'Osteoporoză',
    'Migrenă'
  ]
  
  const hasConditions = Math.random() > 0.3
  if (!hasConditions) return 'Fără antecedente medicale'
  
  const numConditions = Math.floor(Math.random() * 3) + 1
  const selectedConditions = []
  
  for (let i = 0; i < numConditions; i++) {
    const condition = conditions[Math.floor(Math.random() * conditions.length)]
    if (!selectedConditions.includes(condition)) {
      selectedConditions.push(condition)
    }
  }
  
  return selectedConditions.join(', ')
}

// Generează alergii
function generateAllergies() {
  const allergies = [
    'Penicilină',
    'Aspirină',
    'Ibuprofen',
    'Latex',
    'Polen',
    'Acarieni',
    'Lactoză',
    'Gluten',
    'Ouă',
    'Arahide'
  ]
  
  const hasAllergies = Math.random() > 0.7
  if (!hasAllergies) return 'Fără alergii cunoscute'
  
  const numAllergies = Math.floor(Math.random() * 2) + 1
  const selectedAllergies = []
  
  for (let i = 0; i < numAllergies; i++) {
    const allergy = allergies[Math.floor(Math.random() * allergies.length)]
    if (!selectedAllergies.includes(allergy)) {
      selectedAllergies.push(allergy)
    }
  }
  
  return selectedAllergies.join(', ')
}

// Generează medicamente
function generateMedications() {
  const medications = [
    'Amlodipină 5mg',
    'Metformin 500mg',
    'Ventolin inhalator',
    'Aspirină 100mg',
    'Omeprazol 20mg',
    'Levotiroxină 50mcg',
    'Atorvastatină 10mg',
    'Calciu + Vitamina D3',
    'Paracetamol 500mg',
    'Ibuprofen 400mg'
  ]
  
  const takesMedications = Math.random() > 0.4
  if (!takesMedications) return 'Fără medicamente'
  
  const numMedications = Math.floor(Math.random() * 3) + 1
  const selectedMedications = []
  
  for (let i = 0; i < numMedications; i++) {
    const medication = medications[Math.floor(Math.random() * medications.length)]
    if (!selectedMedications.includes(medication)) {
      selectedMedications.push(medication)
    }
  }
  
  return selectedMedications.join(', ')
}

// Generează note
function generateNotes() {
  const notes = [
    'Pacient cooperant',
    'Preferă programări dimineața',
    'Necesită traducător',
    'Accesibilitate pentru scaun cu rotile',
    'Preferă medicul Dr. Popescu',
    'Pacient cu anxietate',
    'Necesită programări urgente',
    'Preferă contact prin SMS',
    'Pacient cu probleme de auz',
    'Necesită însoțitor'
  ]
  
  const hasNotes = Math.random() > 0.6
  if (!hasNotes) return null
  
  const note = notes[Math.floor(Math.random() * notes.length)]
  return note
}

// Populează cache-ul local cu date de test
export const populateTestPatients = async () => {
  try {
    console.log('Populating test patients...')
    const testPatients = generateTestPatients()
    
    // Șterge datele existente
    await indexedDb.clear('patients')
    
    // Adaugă datele de test
    for (const patient of testPatients) {
      await indexedDb.add('patients', patient)
    }
    
    console.log(`Added ${testPatients.length} test patients to cache`)
    return testPatients
  } catch (error) {
    console.error('Error populating test patients:', error)
    throw error
  }
}

// Curăță toate datele din cache
export const clearAllPatientData = async () => {
  try {
    await indexedDb.clear('patients')
    console.log('All patient data cleared from cache')
  } catch (error) {
    console.error('Error clearing patient data:', error)
    throw error
  }
}

// Verifică starea cache-ului
export const checkPatientCacheStatus = async () => {
  try {
    const count = await indexedDb.count('patients')
    const sample = await indexedDb.getAll('patients')
    
    return {
      count,
      hasData: count > 0,
      sample: sample.slice(0, 3),
      lastUpdated: sample.length > 0 ? new Date(sample[0].updatedAt) : null
    }
  } catch (error) {
    console.error('Error checking patient cache status:', error)
    return {
      count: 0,
      hasData: false,
      sample: [],
      lastUpdated: null
    }
  }
}

// Exportă datele din cache
export const exportPatientCacheData = async () => {
  try {
    const patients = await indexedDb.getAll('patients')
    const dataStr = JSON.stringify(patients, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `patients_cache_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    console.log(`Exported ${patients.length} patients from cache`)
  } catch (error) {
    console.error('Error exporting patient cache data:', error)
    throw error
  }
}

// Importă date în cache
export const importPatientCacheData = async (file) => {
  try {
    const text = await file.text()
    const patients = JSON.parse(text)
    
    // Șterge datele existente
    await indexedDb.clear('patients')
    
    // Adaugă datele importate
    for (const patient of patients) {
      await indexedDb.add('patients', patient)
    }
    
    console.log(`Imported ${patients.length} patients to cache`)
    return patients
  } catch (error) {
    console.error('Error importing patient cache data:', error)
    throw error
  }
}
