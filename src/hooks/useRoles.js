import { useState, useEffect, useCallback } from 'react'
import { roleService } from '../services/roleService.js'
import { roleManager } from '../business/roleManager.js'

export const useRoles = () => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // Cache pentru numărul de roluri
  const [roleCount, setRoleCount] = useState(0)

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
      
      setRoles(filteredRoles)
      setRoleCount(filteredRoles.length)
    } catch (err) {
      setError(err.message)
      console.error('Error loading roles:', err)
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
    setLoading(true)
    setError(null)
    
    try {
      const newRole = await roleService.addRole(roleData)
      setRoles(prev => [...prev, newRole])
      setRoleCount(prev => prev + 1)
      return newRole
    } catch (err) {
      setError(err.message)
      console.error('Error adding role:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizează un rol
  const updateRole = useCallback(async (id, roleData) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedRole = await roleService.updateRole(id, roleData)
      setRoles(prev => prev.map(role => 
        role.id === id ? updatedRole : role
      ))
      return updatedRole
    } catch (err) {
      setError(err.message)
      console.error('Error updating role:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Șterge un rol
  const deleteRole = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      await roleService.deleteRole(id)
      setRoles(prev => prev.filter(role => role.id !== id))
      setRoleCount(prev => prev - 1)
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error deleting role:', err)
      throw err
    } finally {
      setLoading(false)
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
    setLoading(true)
    setError(null)
    
    try {
      const roleStats = await roleService.getRoleStats()
      setStats(roleStats)
      return roleStats
    } catch (err) {
      setError(err.message)
      console.error('Error loading role stats:', err)
      return null
    } finally {
      setLoading(false)
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
      const roleIds = roles.map(role => role.id)
      for (const id of roleIds) {
        await deleteRole(id)
      }
      
      setRoles([])
      setRoleCount(0)
      setStats(null)
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error clearing all data:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [roles, deleteRole])

  // Încarcă rolurile la prima renderizare
  useEffect(() => {
    loadRoles()
  }, [loadRoles])

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
