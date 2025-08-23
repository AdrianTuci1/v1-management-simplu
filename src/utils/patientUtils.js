import { indexedDb } from '../data/infrastructure/db.js'

// Utilitare pentru gestionarea pacienților

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
    
    // Adaugă datele importate folosind bulkAdd pentru performanță mai bună
    await indexedDb.bulkAdd('patients', patients)
    
    console.log(`Imported ${patients.length} patients to cache`)
    return patients
  } catch (error) {
    console.error('Error importing patient cache data:', error)
    throw error
  }
}
