import { indexedDb } from '../data/infrastructure/db.js'

// Populează cache-ul cu date de test pentru tratamente
export const populateTestData = async () => {
  try {
    const testTreatments = [
      {
        id: 1,
        treatmentType: 'Consultație stomatologică',
        category: 'Consultații',
        duration: 30,
        price: 100,
        description: 'Consultare de rutină pentru evaluarea stării de sănătate dentară'
      },
      {
        id: 2,
        treatmentType: 'Detartraj',
        category: 'Igienă orală',
        duration: 45,
        price: 150,
        description: 'Curățare profesională a tartrului și a plăcii bacteriene'
      },
      {
        id: 3,
        treatmentType: 'Plombă compozită',
        category: 'Tratamente conservatoare',
        duration: 60,
        price: 200,
        description: 'Restaurare estetică a dinților afectați de carii'
      },
      {
        id: 4,
        treatmentType: 'Extracție dinte',
        category: 'Chirurgie orală',
        duration: 30,
        price: 300,
        description: 'Extragerea unui dinte care nu mai poate fi salvat'
      },
      {
        id: 5,
        treatmentType: 'Radiografie panoramică',
        category: 'Imagini diagnostice',
        duration: 15,
        price: 80,
        description: 'Imagine panoramică pentru evaluarea întregului arcadă dentar'
      },
      {
        id: 6,
        treatmentType: 'Tratament canal',
        category: 'Endodonție',
        duration: 90,
        price: 500,
        description: 'Tratament endodontic pentru salvarea dinților cu pulpa afectată'
      },
      {
        id: 7,
        treatmentType: 'Proteză mobilă',
        category: 'Protezare',
        duration: 120,
        price: 800,
        description: 'Proteză mobilă pentru înlocuirea dinților lipsă'
      },
      {
        id: 8,
        treatmentType: 'Implant dentar',
        category: 'Implantologie',
        duration: 180,
        price: 1500,
        description: 'Implant dentar pentru înlocuirea permanentă a dinților'
      },
      {
        id: 9,
        treatmentType: 'Albire dentară',
        category: 'Estetică',
        duration: 60,
        price: 250,
        description: 'Procedură estetică pentru înălbirea dinților'
      },
      {
        id: 10,
        treatmentType: 'Ortodonție - bracket',
        category: 'Ortodonție',
        duration: 45,
        price: 400,
        description: 'Aplicația bracket-urilor pentru corectarea poziției dinților'
      }
    ]

    // Adaugă timestamp-uri
    const now = new Date().toISOString()
    const treatmentsWithTimestamps = testTreatments.map(treatment => ({
      ...treatment,
      createdAt: now,
      updatedAt: now
    }))

    // Salvează în IndexedDB
    await indexedDb.bulkAdd('treatments', treatmentsWithTimestamps)
    
    console.log('Test treatments data populated successfully')
    return treatmentsWithTimestamps
  } catch (error) {
    console.error('Error populating test treatments data:', error)
    throw error
  }
}

// Curăță toate datele din cache
export const clearAllData = async () => {
  try {
    await indexedDb.clear('treatments')
    console.log('All treatments data cleared successfully')
  } catch (error) {
    console.error('Error clearing treatments data:', error)
    throw error
  }
}

// Verifică starea cache-ului
export const checkCacheStatus = async () => {
  try {
    const count = await indexedDb.count('treatments')
    const treatments = await indexedDb.getAll('treatments')
    
    return {
      count,
      hasData: count > 0,
      treatments: treatments.slice(0, 5), // Primele 5 pentru preview
      total: treatments.length
    }
  } catch (error) {
    console.error('Error checking cache status:', error)
    return {
      count: 0,
      hasData: false,
      treatments: [],
      total: 0,
      error: error.message
    }
  }
}

// Exportă datele din cache
export const exportCacheData = async () => {
  try {
    const treatments = await indexedDb.getAll('treatments')
    return {
      treatments,
      exportDate: new Date().toISOString(),
      count: treatments.length
    }
  } catch (error) {
    console.error('Error exporting cache data:', error)
    throw error
  }
}

// Importă date în cache
export const importCacheData = async (data) => {
  try {
    if (!data.treatments || !Array.isArray(data.treatments)) {
      throw new Error('Invalid data format')
    }

    // Curăță datele existente
    await indexedDb.clear('treatments')
    
    // Adaugă noile date
    await indexedDb.bulkAdd('treatments', data.treatments)
    
    console.log('Cache data imported successfully')
    return {
      imported: data.treatments.length,
      total: await indexedDb.count('treatments')
    }
  } catch (error) {
    console.error('Error importing cache data:', error)
    throw error
  }
}

// Verifică dacă există conflicte pentru un tratament
export const checkTreatmentConflicts = async (treatmentData, excludeId = null) => {
  try {
    const treatments = await indexedDb.getAll('treatments')
    
    const conflicts = treatments.filter(treatment => {
      if (excludeId && treatment.id === excludeId) return false
      
      // Verifică dacă există un tratament cu același nume
      return treatment.treatmentType.toLowerCase() === treatmentData.treatmentType.toLowerCase()
    })

    return conflicts.length > 0
  } catch (error) {
    console.error('Error checking treatment conflicts:', error)
    return false
  }
}

// Obține statistici din cache
export const getCacheStats = async () => {
  try {
    const treatments = await indexedDb.getAll('treatments')
    
    const stats = {
      total: treatments.length,
      categories: {},
      averageDuration: 0,
      averagePrice: 0,
      totalRevenue: 0
    }

    if (treatments.length > 0) {
      // Calculează statistici pe categorii
      treatments.forEach(treatment => {
        if (!stats.categories[treatment.category]) {
          stats.categories[treatment.category] = 0
        }
        stats.categories[treatment.category]++
      })

      // Calculează durata și prețul mediu
      const totalDuration = treatments.reduce((sum, t) => sum + (parseInt(t.duration) || 0), 0)
      const totalPrice = treatments.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0)
      
      stats.averageDuration = Math.round(totalDuration / treatments.length)
      stats.averagePrice = Math.round((totalPrice / treatments.length) * 100) / 100
      stats.totalRevenue = totalPrice
    }

    return stats
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return {
      total: 0,
      categories: {},
      averageDuration: 0,
      averagePrice: 0,
      totalRevenue: 0
    }
  }
}
