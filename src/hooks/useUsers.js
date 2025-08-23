import { useState, useEffect, useCallback } from 'react'
import { userService } from '../services/userService.js'
import { userManager } from '../business/userManager.js'

export const useUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('lastName')
  const [sortOrder, setSortOrder] = useState('asc')

  // Cache pentru numărul de utilizatori
  const [userCount, setUserCount] = useState(0)

  // Încarcă toți utilizatorii
  const loadUsers = useCallback(async (customFilters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const allFilters = { ...filters, ...customFilters }
      const usersData = await userService.getUsers(allFilters)
      
      // Aplică filtrele și sortarea
      let filteredUsers = userManager.filterUsers(usersData, allFilters)
      filteredUsers = userManager.sortUsers(filteredUsers, sortBy, sortOrder)
      
      setUsers(filteredUsers)
      setUserCount(filteredUsers.length)
    } catch (err) {
      setError(err.message)
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder])

  // Obține un utilizator după ID din lista locală
  const getUserById = useCallback((id) => {
    return users.find(user => user.id === id) || null
  }, [users])

  // Adaugă un utilizator nou
  const addUser = useCallback(async (userData) => {
    setLoading(true)
    setError(null)
    
    try {
      const newUser = await userService.addUser(userData)
      setUsers(prev => [...prev, newUser])
      setUserCount(prev => prev + 1)
      return newUser
    } catch (err) {
      setError(err.message)
      console.error('Error adding user:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizează un utilizator
  const updateUser = useCallback(async (id, userData) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedUser = await userService.updateUser(id, userData)
      setUsers(prev => prev.map(user => 
        user.id === id ? updatedUser : user
      ))
      return updatedUser
    } catch (err) {
      setError(err.message)
      console.error('Error updating user:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Șterge un utilizator
  const deleteUser = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      await userService.deleteUser(id)
      setUsers(prev => prev.filter(user => user.id !== id))
      setUserCount(prev => prev - 1)
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error deleting user:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Căutare utilizatori
  const searchUsers = useCallback(async (query, searchFilters = {}, limit = 50) => {
    setLoading(true)
    setError(null)
    
    try {
      const searchResults = await userService.searchUsers(query, { ...searchFilters, limit })
      setUsers(searchResults)
      setUserCount(searchResults.length)
      return searchResults
    } catch (err) {
      setError(err.message)
      console.error('Error searching users:', err)
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
      const userStats = await userService.getUserStats()
      setStats(userStats)
      return userStats
    } catch (err) {
      setError(err.message)
      console.error('Error loading user stats:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Export utilizatori
  const exportUsers = useCallback(async (format = 'json') => {
    setLoading(true)
    setError(null)
    
    try {
      const exportData = await userService.exportUsers(format)
      return exportData
    } catch (err) {
      setError(err.message)
      console.error('Error exporting users:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Filtrare locală
  const filterUsers = useCallback((filterOptions) => {
    setFilters(prev => ({ ...prev, ...filterOptions }))
  }, [])

  // Sortare
  const sortUsers = useCallback((newSortBy, newSortOrder = 'asc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }, [])

  // Reset filtre
  const resetFilters = useCallback(() => {
    setFilters({})
    setSortBy('lastName')
    setSortOrder('asc')
  }, [])

  // Populează cu date de test
  const populateTestData = useCallback(async (count = 10) => {
    setLoading(true)
    setError(null)
    
    try {
      const testUsers = userManager.generateTestUsers(count)
      
      // Adaugă utilizatorii unul câte unul
      for (const userData of testUsers) {
        await addUser(userData)
      }
      
      return testUsers.length
    } catch (err) {
      setError(err.message)
      console.error('Error populating test data:', err)
      return 0
    } finally {
      setLoading(false)
    }
  }, [addUser])

  // Curăță toate datele
  const clearAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Șterge toți utilizatorii
      const userIds = users.map(user => user.id)
      for (const id of userIds) {
        await deleteUser(id)
      }
      
      setUsers([])
      setUserCount(0)
      setStats(null)
      return true
    } catch (err) {
      setError(err.message)
      console.error('Error clearing all data:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [users, deleteUser])

  // Încarcă utilizatorii la prima renderizare
  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  return {
    // State
    users,
    loading,
    error,
    stats,
    userCount,
    filters,
    sortBy,
    sortOrder,

    // Actions
    loadUsers,
    getUserById,
    addUser,
    updateUser,
    deleteUser,
    searchUsers,
    loadStats,
    exportUsers,
    filterUsers,
    sortUsers,
    resetFilters,
    populateTestData,
    clearAllData,

    // Utilitare
    getActiveUsers: () => users.filter(user => user.status === 'active'),
    getInactiveUsers: () => users.filter(user => user.status === 'inactive'),
    getUsersBySpecialization: (specialization) => 
      users.filter(user => user.specialization === specialization)
  }
}
