import { useState, useEffect, useCallback } from 'react'
import { permissionService } from '../services/permissionService.js'
import { permissionManager } from '../business/permissionManager.js'

export const usePermissions = () => {
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('resource')
  const [sortOrder, setSortOrder] = useState('asc')

  // Cache pentru numărul de permisiuni
  const [permissionCount, setPermissionCount] = useState(0)

  // Încarcă toate permisiunile
  const loadPermissions = useCallback(async (customFilters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const allFilters = { ...filters, ...customFilters }
      const permissionsData = await permissionService.getPermissions(allFilters)
      
      // Aplică filtrele și sortarea
      let filteredPermissions = permissionManager.filterPermissions(permissionsData, allFilters)
      filteredPermissions = permissionManager.sortPermissions(filteredPermissions, sortBy, sortOrder)
      
      setPermissions(filteredPermissions)
      setPermissionCount(filteredPermissions.length)
    } catch (err) {
      setError(err.message)
      console.error('Error loading permissions:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder])

  // Obține o permisiune după ID din lista locală
  const getPermissionById = useCallback((id) => {
    return permissions.find(permission => permission.id === id) || null
  }, [permissions])

  // Adaugă o permisiune nouă
  const addPermission = useCallback(async (permissionData) => {
    setLoading(true)
    setError(null)
    
    try {
      const newPermission = await permissionService.addPermission(permissionData)
      setPermissions(prev => [...prev, newPermission])
      setPermissionCount(prev => prev + 1)
      return newPermission
    } catch (err) {
      setError(err.message)
      console.error('Error adding permission:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizează o permisiune
  const updatePermission = useCallback(async (id, permissionData) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedPermission = await permissionService.updatePermission(id, permissionData)
      setPermissions(prev => prev.map(permission => 
        permission.id === id ? updatedPermission : permission
      ))
      return updatedPermission
    } catch (err) {
      setError(err.message)
      console.error('Error updating permission:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Șterge o permisiune
  const deletePermission = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      await permissionService.deletePermission(id)
      setPermissions(prev => prev.filter(permission => permission.id !== id))
      setPermissionCount(prev => prev - 1)
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error deleting permission:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Căutare permisiuni
  const searchPermissions = useCallback(async (query, searchFilters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const searchResults = await permissionService.searchPermissions(query, searchFilters)
      return searchResults
    } catch (err) {
      setError(err.message)
      console.error('Error searching permissions:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Încarcă statisticile
  const loadStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const permissionStats = await permissionService.getPermissionStats()
      setStats(permissionStats)
      return permissionStats
    } catch (err) {
      setError(err.message)
      console.error('Error loading permission stats:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Export permisiuni
  const exportPermissions = useCallback(async (format = 'json') => {
    setLoading(true)
    setError(null)
    
    try {
      const exportData = await permissionService.exportPermissions(format)
      return exportData
    } catch (err) {
      setError(err.message)
      console.error('Error exporting permissions:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Filtrare locală
  const filterPermissions = useCallback((filterOptions) => {
    setFilters(prev => ({ ...prev, ...filterOptions }))
  }, [])

  // Sortare
  const sortPermissions = useCallback((newSortBy, newSortOrder = 'asc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }, [])

  // Reset filtre
  const resetFilters = useCallback(() => {
    setFilters({})
    setSortBy('resource')
    setSortOrder('asc')
  }, [])

  // Populează cu date de test
  const populateTestData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const testPermissions = permissionManager.generateTestPermissions()
      
      // Adaugă permisiunile unul câte unul
      for (const permissionData of testPermissions) {
        await addPermission(permissionData)
      }
      
      return testPermissions.length
    } catch (err) {
      setError(err.message)
      console.error('Error populating test data:', err)
      return 0
    } finally {
      setLoading(false)
    }
  }, [addPermission])

  // Curăță toate datele
  const clearAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Șterge toate permisiunile
      const permissionIds = permissions.map(permission => permission.id)
      for (const id of permissionIds) {
        await deletePermission(id)
      }
      
      setPermissions([])
      setPermissionCount(0)
      setStats(null)
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error clearing all data:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [permissions, deletePermission])

  // Încarcă permisiunile la prima renderizare
  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  return {
    // State
    permissions,
    loading,
    error,
    stats,
    permissionCount,
    filters,
    sortBy,
    sortOrder,

    // Actions
    loadPermissions,
    getPermissionById,
    addPermission,
    updatePermission,
    deletePermission,
    searchPermissions,
    loadStats,
    exportPermissions,
    filterPermissions,
    sortPermissions,
    resetFilters,
    populateTestData,
    clearAllData,

    // Utilitare
    getPermissionsByResource: (resource) => 
      permissions.filter(permission => permission.resource === resource),
    getPermissionsByAction: (action) => 
      permissions.filter(permission => permission.action === action),
    getAvailableResources: () => 
      permissionManager.getAvailableResources(permissions),
    getAvailableActions: () => 
      permissionManager.getAvailableActions(permissions),
    hasPermission: (userPermissions, resource, action) => 
      permissionManager.hasPermission(userPermissions, resource, action)
  }
}
