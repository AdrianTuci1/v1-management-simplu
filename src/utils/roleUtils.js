import { db } from '../data/infrastructure/db.js'
import { roleManager } from '../business/roleManager.js'

// Populează cache-ul cu date de test
export const populateTestData = async (count = 5) => {
  try {
    console.log(`Populare cu ${count} roluri de test...`)
    
    const testRoles = roleManager.generateTestRoles(count)
    
    // Adaugă rolurile în IndexedDB
    await db.roles.bulkPut(testRoles)
    
    console.log(`S-au adăugat ${testRoles.length} roluri de test`)
    return testRoles.length
  } catch (error) {
    console.error('Eroare la popularea datelor de test:', error)
    throw error
  }
}

// Curăță toate datele din cache
export const clearAllData = async () => {
  try {
    console.log('Curățare toate datele...')
    
    // Șterge toate rolurile
    await db.roles.clear()
    
    console.log('Toate datele au fost șterse')
    return true
  } catch (error) {
    console.error('Eroare la ștergerea datelor:', error)
    throw error
  }
}

// Verifică starea cache-ului
export const checkCacheStatus = async () => {
  try {
    const rolesCount = await db.roles.count()
    const roles = await db.roles.toArray()
    
    const status = {
      rolesCount,
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        status: role.status,
        permissionsCount: role.permissions?.length || 0
      }))
    }
    
    console.log('Status cache roluri:', status)
    return status
  } catch (error) {
    console.error('Eroare la verificarea statusului cache:', error)
    throw error
  }
}

// Export date din cache
export const exportCacheData = async (format = 'json') => {
  try {
    const roles = await db.roles.toArray()
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(roles, null, 2)
      case 'csv':
        return roleManager.exportToCSV(roles)
      default:
        throw new Error(`Format necunoscut: ${format}`)
    }
  } catch (error) {
    console.error('Eroare la exportul datelor:', error)
    throw error
  }
}

// Import date în cache
export const importCacheData = async (data, format = 'json') => {
  try {
    let roles = []
    
    switch (format.toLowerCase()) {
      case 'json':
        roles = typeof data === 'string' ? JSON.parse(data) : data
        break
      case 'csv':
        // Implementare pentru CSV dacă este necesar
        throw new Error('Import CSV nu este implementat încă')
      default:
        throw new Error(`Format necunoscut: ${format}`)
    }
    
    // Validare și transformare date
    const validRoles = roles.map(role => roleManager.transformRoleForAPI(role))
    
    // Adaugă în IndexedDB
    await db.roles.bulkPut(validRoles)
    
    console.log(`S-au importat ${validRoles.length} roluri`)
    return validRoles.length
  } catch (error) {
    console.error('Eroare la importul datelor:', error)
    throw error
  }
}

// Verifică integritatea datelor
export const checkDataIntegrity = async () => {
  try {
    const roles = await db.roles.toArray()
    const issues = []
    
    roles.forEach((role, index) => {
      // Verifică câmpurile obligatorii
      if (!role.name) {
        issues.push(`Rol ${index}: Nume lipsă`)
      }
      
      if (!role.description) {
        issues.push(`Rol ${index}: Descriere lipsă`)
      }
      
      // Verifică permisiunile
      if (role.permissions && !Array.isArray(role.permissions)) {
        issues.push(`Rol ${index}: Permisiuni nu sunt array`)
      }
      
      if (role.permissions) {
        role.permissions.forEach((permission, permIndex) => {
          if (!permission.resource || !permission.action) {
            issues.push(`Rol ${index}, Permisiune ${permIndex}: Resource sau action lipsă`)
          }
        })
      }
    })
    
    return {
      totalRoles: roles.length,
      issues,
      isValid: issues.length === 0
    }
  } catch (error) {
    console.error('Eroare la verificarea integrității:', error)
    throw error
  }
}

// Repară datele corupte
export const repairData = async () => {
  try {
    const roles = await db.roles.toArray()
    const repairedRoles = []
    
    roles.forEach(role => {
      const repairedRole = {
        ...role,
        name: role.name || 'Rol fără nume',
        description: role.description || 'Fără descriere',
        status: role.status || 'active',
        permissions: Array.isArray(role.permissions) ? role.permissions : [],
        createdAt: role.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // Curăță permisiunile
      repairedRole.permissions = repairedRole.permissions.filter(permission => 
        permission.resource && permission.action
      )
      
      repairedRoles.push(repairedRole)
    })
    
    // Actualizează în IndexedDB
    await db.roles.bulkPut(repairedRoles)
    
    console.log(`S-au reparat ${repairedRoles.length} roluri`)
    return repairedRoles.length
  } catch (error) {
    console.error('Eroare la repararea datelor:', error)
    throw error
  }
}

// Obține statistici detaliate
export const getDetailedStats = async () => {
  try {
    const roles = await db.roles.toArray()
    
    // Statistici de bază
    const total = roles.length
    const active = roles.filter(r => r.status === 'active').length
    const inactive = roles.filter(r => r.status === 'inactive').length
    const archived = roles.filter(r => r.status === 'archived').length
    
    // Statistici permisiuni
    const totalPermissions = roles.reduce((sum, role) => 
      sum + (role.permissions?.length || 0), 0
    )
    const avgPermissions = total > 0 ? Math.round(totalPermissions / total) : 0
    
    // Roluri cu cele mai multe permisiuni
    const rolesByPermissions = [...roles]
      .sort((a, b) => (b.permissions?.length || 0) - (a.permissions?.length || 0))
      .slice(0, 5)
      .map(role => ({
        name: role.name,
        permissionsCount: role.permissions?.length || 0
      }))
    
    // Resurse cele mai folosite
    const resourceUsage = {}
    roles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(permission => {
          resourceUsage[permission.resource] = (resourceUsage[permission.resource] || 0) + 1
        })
      }
    })
    
    const topResources = Object.entries(resourceUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([resource, count]) => ({ resource, count }))
    
    return {
      total,
      active,
      inactive,
      archived,
      totalPermissions,
      avgPermissions,
      rolesByPermissions,
      topResources,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    }
  } catch (error) {
    console.error('Eroare la obținerea statisticilor:', error)
    throw error
  }
}

// Backup și restore
export const createBackup = async () => {
  try {
    const roles = await db.roles.toArray()
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      roles
    }
    
    return backup
  } catch (error) {
    console.error('Eroare la crearea backup-ului:', error)
    throw error
  }
}

export const restoreBackup = async (backup) => {
  try {
    if (!backup.roles || !Array.isArray(backup.roles)) {
      throw new Error('Backup invalid')
    }
    
    // Curăță datele existente
    await db.roles.clear()
    
    // Restore datele
    await db.roles.bulkPut(backup.roles)
    
    console.log(`S-au restaurat ${backup.roles.length} roluri`)
    return backup.roles.length
  } catch (error) {
    console.error('Eroare la restaurarea backup-ului:', error)
    throw error
  }
}
