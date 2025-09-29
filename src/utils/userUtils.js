import { db } from '../data/infrastructure/db.js'
import { userManager } from '../business/userManager.js'

// Populează cache-ul cu date de test
export const populateTestData = async (count = 10) => {
  try {
    console.log(`Populare cache cu ${count} utilizatori de test...`)
    
    const testUsers = userManager.generateTestUsers(count)
    
    // Adaugă în IndexedDB
    await db.transaction('rw', db.user, async () => {
      for (const user of testUsers) {
        await db.user.put(user)
      }
    })
    
    console.log(`✅ Adăugați ${testUsers.length} utilizatori de test în cache`)
    return testUsers.length
  } catch (error) {
    console.error('❌ Eroare la popularea datelor de test:', error)
    throw error
  }
}

// Curăță toate datele din cache
export const clearAllData = async () => {
  try {
    console.log('Curățare cache utilizatori...')
    
    await db.transaction('rw', db.user, async () => {
      await db.user.clear()
    })
    
    console.log('✅ Cache utilizatori curățat')
    return true
  } catch (error) {
    console.error('❌ Eroare la curățarea cache-ului:', error)
    throw error
  }
}

// Verifică starea cache-ului
export const checkCacheStatus = async () => {
  try {
    const userCount = await db.user.count()
    const specializations = await db.user.toArray()
    
    const specStats = {}
    specializations.forEach(user => {
      const spec = user.specialization || 'Necunoscută'
      specStats[spec] = (specStats[spec] || 0) + 1
    })
    
    const statusStats = {}
    specializations.forEach(user => {
      const status = user.status || 'unknown'
      statusStats[status] = (statusStats[status] || 0) + 1
    })
    
    return {
      totalUsers: userCount,
      specializations: specStats,
      statuses: statusStats,
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Eroare la verificarea cache-ului:', error)
    return null
  }
}

// Export date din cache
export const exportCacheData = async (format = 'json') => {
  try {
    const users = await db.user.toArray()
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(users, null, 2)
      case 'csv':
        return userManager.exportToCSV(users)
      default:
        throw new Error(`Format necunoscut: ${format}`)
    }
  } catch (error) {
    console.error('❌ Eroare la exportul datelor:', error)
    throw error
  }
}

// Import date în cache
export const importCacheData = async (data, format = 'json') => {
  try {
    let users = []
    
    switch (format.toLowerCase()) {
      case 'json':
        users = typeof data === 'string' ? JSON.parse(data) : data
        break
      case 'csv':
        // Implementare pentru CSV dacă este necesară
        throw new Error('Import CSV nu este implementat încă')
      default:
        throw new Error(`Format necunoscut: ${format}`)
    }
    
    // Validare și transformare
    const validUsers = users.map(user => userManager.transformUserForAPI(user))
    
    // Adaugă în cache
    await db.transaction('rw', db.user, async () => {
      for (const user of validUsers) {
        await db.user.put(user)
      }
    })
    
    console.log(`✅ Importați ${validUsers.length} utilizatori în cache`)
    return validUsers.length
  } catch (error) {
    console.error('❌ Eroare la importul datelor:', error)
    throw error
  }
}

// Sincronizează cache-ul cu API-ul
export const syncCacheWithAPI = async () => {
  try {
    console.log('Sincronizare cache cu API...')
    
    // Aici ar trebui să faci un call către API pentru a obține toți utilizatorii
    // Pentru moment, vom returna un mesaj informativ
    console.log('⚠️ Sincronizarea cu API nu este implementată încă')
    return {
      success: false,
      message: 'Sincronizarea cu API nu este implementată încă'
    }
  } catch (error) {
    console.error('❌ Eroare la sincronizare:', error)
    throw error
  }
}

// Verifică dacă un email există deja
export const checkEmailExists = async (email, excludeId = null) => {
  try {
    const existingUser = await db.user
      .where('email')
      .equals(email.toLowerCase())
      .first()
    
    if (!existingUser) return false
    
    // Dacă avem un ID de exclus (pentru update), verifică dacă este același utilizator
    if (excludeId && existingUser.id === excludeId) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('❌ Eroare la verificarea email-ului:', error)
    return false
  }
}

// Verifică dacă un număr de licență există deja
export const checkLicenseExists = async (licenseNumber, excludeId = null) => {
  try {
    const existingUser = await db.user
      .where('licenseNumber')
      .equals(licenseNumber)
      .first()
    
    if (!existingUser) return false
    
    // Dacă avem un ID de exclus (pentru update), verifică dacă este același utilizator
    if (excludeId && existingUser.id === excludeId) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('❌ Eroare la verificarea numărului de licență:', error)
    return false
  }
}

// Obține utilizatorii după specializare
export const getUsersBySpecialization = async (specialization) => {
  try {
    const users = await db.user
      .where('specialization')
      .equals(specialization)
      .toArray()
    
    return userManager.transformUsersForUI(users)
  } catch (error) {
    console.error('❌ Eroare la obținerea utilizatorilor după specializare:', error)
    return []
  }
}

// Obține utilizatorii după status
export const getUsersByStatus = async (status) => {
  try {
    const users = await db.user
      .where('status')
      .equals(status)
      .toArray()
    
    return userManager.transformUsersForUI(users)
  } catch (error) {
    console.error('❌ Eroare la obținerea utilizatorilor după status:', error)
    return []
  }
}

// Căutare avansată în cache
export const searchUsersInCache = async (query, filters = {}) => {
  try {
    let users = await db.user.toArray()
    
    // Aplică filtrele
    if (filters.status) {
      users = users.filter(user => user.status === filters.status)
    }
    
    if (filters.specialization) {
      users = users.filter(user => 
        user.specialization?.toLowerCase().includes(filters.specialization.toLowerCase())
      )
    }
    
    // Aplică căutarea text
    if (query) {
      const searchTerm = query.toLowerCase()
      users = users.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.specialization?.toLowerCase().includes(searchTerm) ||
        user.licenseNumber?.toLowerCase().includes(searchTerm)
      )
    }
    
    return userManager.transformUsersForUI(users)
  } catch (error) {
    console.error('❌ Eroare la căutarea în cache:', error)
    return []
  }
}

// Backup cache
export const backupCache = async () => {
  try {
    const users = await db.user.toArray()
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: users
    }
    
    const backupString = JSON.stringify(backup, null, 2)
    
    // Creează un blob pentru download
    const blob = new Blob([backupString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    // Descarcă fișierul
    const a = document.createElement('a')
    a.href = url
    a.download = `users-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log('✅ Backup creat cu succes')
    return true
  } catch (error) {
    console.error('❌ Eroare la crearea backup-ului:', error)
    throw error
  }
}

// Restore cache din backup
export const restoreCache = async (backupData) => {
  try {
    const backup = typeof backupData === 'string' ? JSON.parse(backupData) : backupData
    
    if (!backup.data || !Array.isArray(backup.data)) {
      throw new Error('Format de backup invalid')
    }
    
    // Curăță cache-ul existent
    await db.user.clear()
    
    // Restore datele
    await db.transaction('rw', db.user, async () => {
      for (const user of backup.data) {
        await db.user.put(user)
      }
    })
    
    console.log(`✅ Restore complet: ${backup.data.length} utilizatori`)
    return backup.data.length
  } catch (error) {
    console.error('❌ Eroare la restore:', error)
    throw error
  }
}
