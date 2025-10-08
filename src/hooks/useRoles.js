import { useState, useEffect, useCallback } from 'react'
import { roleService } from '../services/roleService.js'
import { roleManager } from '../business/roleManager.js'
import { indexedDb } from '../data/infrastructure/db.js'
import { onResourceMessage } from '../data/infrastructure/websocketClient.js'

// Shared state for all instances
let sharedRoles = []
let sharedStats = null
let subscribers = new Set()

function notifySubscribers() {
  console.log('Notifying role subscribers. Count:', subscribers.size, 'Roles count:', sharedRoles.length)
  subscribers.forEach(cb => cb([...sharedRoles]))
}

export const useRoles = () => {
  const [roles, setRoles] = useState(sharedRoles)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(sharedStats)
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // Cache pentru numărul de roluri
  const [roleCount, setRoleCount] = useState(sharedRoles.length)

  // Încarcă toate rolurile
  const loadRoles = useCallback(async (customFilters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const allFilters = { ...filters, ...customFilters }
      const rolesData = await roleService.getRoles(allFilters)
      
      // Aplică filtrele și sortarea
      let filteredRoles = roleManager.filterRoles(rolesData, allFilters)
      filteredRoles = roleManager.sortRoles(filteredRoles, sortBy, sortOrder)
      
      sharedRoles = filteredRoles
      setRoles([...filteredRoles])
      setRoleCount(filteredRoles.length)
      notifySubscribers()
    } catch (err) {
      // Încearcă să încarce din cache local
      try {
        console.warn('Roles API failed, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('role')
        
        if (cachedData.length > 0) {
          // Transformăm datele din cache pentru UI
          const transformedData = cachedData.map(role => 
            roleManager.transformRoleForUI(role)
          )
          sharedRoles = transformedData
          setRoles([...transformedData])
          setRoleCount(transformedData.length)
          setError(null) // Nu setează eroarea când avem date din cache
          notifySubscribers()
        } else {
          setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.')
        }
      } catch (cacheErr) {
        setError('Nu s-au putut încărca datele. Verifică conexiunea la internet.')
        console.error('Error loading roles:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder])

  // Obține un rol după ID din lista locală
  const getRoleById = useCallback((id) => {
    return roles.find(role => role.id === id) || null
  }, [roles])

  // Adaugă un rol nou
  const addRole = useCallback(async (roleData) => {
    setError(null)
    
    try {
      const newRole = await roleService.addRole(roleData)
      const ui = roleManager.transformRoleForUI(newRole)
      
      // Adaugă optimistic update
      if (ui._isOptimistic || ui._tempId) {
        const idx = sharedRoles.findIndex(r => r._tempId === ui._tempId)
        if (idx >= 0) {
          sharedRoles[idx] = ui
        } else {
          sharedRoles = [ui, ...sharedRoles]
        }
        setRoles([...sharedRoles])
        setRoleCount(sharedRoles.length)
        notifySubscribers()
      }
      
      return ui
    } catch (err) {
      setError(err.message)
      console.error('Error adding role:', err)
      throw err
    }
  }, [])

  // Actualizează un rol
  const updateRole = useCallback(async (id, roleData) => {
    setError(null)
    
    try {
      const updated = await roleService.updateRole(id, roleData)
      const ui = roleManager.transformRoleForUI(updated)
      const idx = sharedRoles.findIndex(r => r.id === id || r.resourceId === id)
      if (idx >= 0) sharedRoles[idx] = { ...ui, _isOptimistic: false }
      setRoles([...sharedRoles])
      notifySubscribers()
      return ui
    } catch (err) {
      setError(err.message)
      console.error('Error updating role:', err)
      throw err
    }
  }, [])

  // Șterge un rol
  const deleteRole = useCallback(async (id) => {
    setError(null)
    
    try {
      await roleService.deleteRole(id)
      sharedRoles = sharedRoles.filter(r => (r.id !== id && r.resourceId !== id))
      setRoles([...sharedRoles])
      setRoleCount(sharedRoles.length)
      notifySubscribers()
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error deleting role:', err)
      throw err
    }
  }, [])

  // Căutare roluri
  const searchRoles = useCallback(async (query, searchFilters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const searchResults = await roleService.searchRoles(query, searchFilters)
      return searchResults
    } catch (err) {
      setError(err.message)
      console.error('Error searching roles:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Încarcă statisticile
  const loadStats = useCallback(async () => {
    try {
      const roleStats = await roleService.getRoleStats()
      sharedStats = roleStats
      setStats(roleStats)
      return roleStats
    } catch (err) {
      console.error('Error loading role stats:', err)
      // Fallback stats
      sharedStats = null
      return null
    }
  }, [])

  // Export roluri
  const exportRoles = useCallback(async (format = 'json') => {
    setLoading(true)
    setError(null)
    
    try {
      const exportData = await roleService.exportRoles(format)
      return exportData
    } catch (err) {
      setError(err.message)
      console.error('Error exporting roles:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Filtrare locală
  const filterRoles = useCallback((filterOptions) => {
    setFilters(prev => ({ ...prev, ...filterOptions }))
  }, [])

  // Sortare
  const sortRoles = useCallback((newSortBy, newSortOrder = 'asc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }, [])

  // Reset filtre
  const resetFilters = useCallback(() => {
    setFilters({})
    setSortBy('name')
    setSortOrder('asc')
  }, [])

  // Populează cu date de test
  const populateTestData = useCallback(async (count = 5) => {
    setLoading(true)
    setError(null)
    
    try {
      const testRoles = roleManager.generateTestRoles(count)
      
      // Adaugă rolurile unul câte unul
      for (const roleData of testRoles) {
        await addRole(roleData)
      }
      
      return testRoles.length
    } catch (err) {
      setError(err.message)
      console.error('Error populating test data:', err)
      return 0
    } finally {
      setLoading(false)
    }
  }, [addRole])

  // Curăță toate datele
  const clearAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Șterge toate rolurile
      const roleIds = sharedRoles.map(role => role.id)
      for (const id of roleIds) {
        await deleteRole(id)
      }
      
      sharedRoles = []
      sharedStats = null
      setRoles([])
      setRoleCount(0)
      setStats(null)
      notifySubscribers()
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error clearing all data:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [deleteRole])

  // Încarcă datele la montarea componentei și subscribe to updates
  useEffect(() => {
    // Initialize from shared state and subscribe to updates
    setRoles([...sharedRoles])
    setStats(sharedStats)
    setRoleCount(sharedRoles.length)
    
    // Adaugă subscriber pentru actualizări
    const subscriber = (newRoles) => {
      console.log('Role subscriber called with roles count:', newRoles.length)
      setRoles(newRoles)
      setRoleCount(newRoles.length)
    }
    subscribers.add(subscriber)
    const unsub = () => subscribers.delete(subscriber)
    
    // Initial data load
    loadRoles()
    loadStats()
    
    // Subscribe la actualizări prin websocket
    const handler = async (message) => {
      const { type, data, resourceType } = message
      if (resourceType !== 'role') return
      const operation = type?.replace('resource_', '') || type
      const id = data?.id || data?.resourceId
      if (!id) return
      
      try {
        if (operation === 'created' || operation === 'create') {
          // Înlocuiește rolul optimist cu datele reale
          const ui = roleManager.transformRoleForUI({ ...data, id, resourceId: id })
          
          // Caută în outbox pentru a găsi operația optimistă folosind ID-ul real
          const outboxEntry = await indexedDb.outboxFindByResourceId(id, 'role')
          
          if (outboxEntry) {
            const optimisticIndex = sharedRoles.findIndex(r => r._tempId === outboxEntry.tempId)
            if (optimisticIndex >= 0) {
              sharedRoles[optimisticIndex] = { ...ui, _isOptimistic: false }
            }
            await indexedDb.outboxDelete(outboxEntry.id)
          } else {
            // Dacă nu găsim în outbox, încercăm să găsim după euristică
            const optimisticIndex = sharedRoles.findIndex(r => 
              r._isOptimistic && 
              r.name === data.name &&
              r.description === data.description
            )
            if (optimisticIndex >= 0) {
              sharedRoles[optimisticIndex] = { ...ui, _isOptimistic: false }
            } else {
              // Verifică dacă nu există deja (evită dubluri)
              const existingIndex = sharedRoles.findIndex(r => r.id === id || r.resourceId === id)
              if (existingIndex >= 0) {
                sharedRoles[existingIndex] = { ...ui, _isOptimistic: false }
              } else {
                // Adaugă ca nou doar dacă nu există deloc
                sharedRoles = [{ ...ui, _isOptimistic: false }, ...sharedRoles]
              }
            }
          }
          
          setRoles([...sharedRoles])
          setRoleCount(sharedRoles.length)
          notifySubscribers()
        } else if (operation === 'updated' || operation === 'update') {
          // Actualizează rolul existent
          const ui = roleManager.transformRoleForUI({ ...data, id, resourceId: id })
          const idx = sharedRoles.findIndex(r => r.id === id || r.resourceId === id)
          if (idx >= 0) {
            sharedRoles[idx] = { ...ui, _isOptimistic: false }
            setRoles([...sharedRoles])
            notifySubscribers()
          }
        } else if (operation === 'deleted' || operation === 'delete') {
          // Șterge rolul
          sharedRoles = sharedRoles.filter(r => r.id !== id && r.resourceId !== id)
          setRoles([...sharedRoles])
          setRoleCount(sharedRoles.length)
          notifySubscribers()
        }
      } catch (err) {
        console.error('Error handling WebSocket role update:', err)
      }
    }
    
    const unsubscribe = onResourceMessage('role', handler)
    
    return () => {
      unsub()
      unsubscribe()
    }
  }, [loadRoles, loadStats])

  return {
    // State
    roles,
    loading,
    error,
    stats,
    roleCount,
    filters,
    sortBy,
    sortOrder,

    // Actions
    loadRoles,
    getRoleById,
    addRole,
    updateRole,
    deleteRole,
    searchRoles,
    loadStats,
    exportRoles,
    filterRoles,
    sortRoles,
    resetFilters,
    populateTestData,
    clearAllData,

    // Utilitare
    getActiveRoles: () => roles.filter(role => role.status === 'active'),
    getInactiveRoles: () => roles.filter(role => role.status === 'inactive'),
    getArchivedRoles: () => roles.filter(role => role.status === 'archived'),
    getRolesByPermissionsCount: (minCount) => 
      roles.filter(role => (role.permissions?.length || 0) >= minCount)
  }
}
