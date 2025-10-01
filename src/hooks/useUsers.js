import { useState, useEffect, useCallback } from 'react'
import { userService } from '../services/userService.js'
import { userManager } from '../business/userManager.js'
import { indexedDb } from '../data/infrastructure/db.js'
import { onResourceMessage } from '../data/infrastructure/websocketClient.js'

// Stare partajată la nivel de modul pentru sincronizare între instanțe
let sharedUsers = []
let sharedStats = null
let sharedUserCount = 0
const subscribers = new Set()

// Funcție pentru notificarea abonaților
const notifySubscribers = () => {
  subscribers.forEach(callback => callback(sharedUsers, sharedStats, sharedUserCount))
}

// Optimismul este gestionat în Repository

export const useUsers = () => {
  const [users, setUsers] = useState(sharedUsers)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(sharedStats)
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('lastName')
  const [sortOrder, setSortOrder] = useState('asc')
  const [userCount, setUserCount] = useState(sharedUserCount)

  // Abonare la schimbările de stare partajată
  useEffect(() => {
    const handleStateChange = (newUsers, newStats, newCount) => {
      setUsers(newUsers)
      setStats(newStats)
      setUserCount(newCount)
    }
    
    subscribers.add(handleStateChange)
    return () => subscribers.delete(handleStateChange)
  }, [])

  // WebSocket handling pentru utilizatori (reflectă starea finală)
  useEffect(() => {
    const handler = async (message) => {
      const { type, data, resourceType } = message
      if (resourceType !== 'medic' && resourceType !== 'user') return
      const operation = type?.replace('resource_', '') || type
      const userId = data?.id || data?.resourceId
      if (!userId) return
      if (operation === 'created' || operation === 'create') {
        const ui = userManager.transformUserForUI({ ...data, id: userId, resourceId: userId })
        const idx = sharedUsers.findIndex(u => u.id === userId || u.resourceId === userId)
        if (idx >= 0) sharedUsers[idx] = { ...ui, _isOptimistic: false }
        else sharedUsers = [{ ...ui, _isOptimistic: false }, ...sharedUsers]
        sharedUserCount = sharedUsers.length
        notifySubscribers()
      } else if (operation === 'updated' || operation === 'update') {
        const idx = sharedUsers.findIndex(u => u.id === userId || u.resourceId === userId)
        if (idx >= 0) {
          const ui = userManager.transformUserForUI({ ...data, id: userId, resourceId: userId })
          sharedUsers[idx] = { ...ui, _isOptimistic: false }
          notifySubscribers()
        }
      } else if (operation === 'deleted' || operation === 'delete') {
        sharedUsers = sharedUsers.filter(u => (u.id !== userId && u.resourceId !== userId))
        sharedUserCount = sharedUsers.length
        notifySubscribers()
      }
    }

    // Abonează-te la mesajele WebSocket pentru utilizatori
    const unsubPlural = onResourceMessage('users', handler)
    const unsubSingular = onResourceMessage('user', handler)

    return () => {
      unsubPlural()
      unsubSingular()
    }
  }, [])

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
      
      // Actualizează starea partajată
      sharedUsers = filteredUsers
      sharedUserCount = filteredUsers.length
      notifySubscribers()
    } catch (err) {
      // Încearcă să încarce din cache local dacă API-ul eșuează
      try {
        console.warn('API failed, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('users')
        
        // Aplică filtrele pe datele din cache
        let filteredUsers = cachedData
        
        if (allFilters.status) {
          filteredUsers = filteredUsers.filter(user => user.status === allFilters.status)
        }
        if (allFilters.role) {
          filteredUsers = filteredUsers.filter(user => user.role === allFilters.role)
        }
        if (allFilters.specialization) {
          filteredUsers = filteredUsers.filter(user => user.specialization === allFilters.specialization)
        }
        
        // Aplică sortarea
        filteredUsers = userManager.sortUsers(filteredUsers, sortBy, sortOrder)
        
        // Actualizează starea partajată
        sharedUsers = filteredUsers
        sharedUserCount = filteredUsers.length
        notifySubscribers()
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error loading users:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder])

  // Obține un utilizator după ID din lista locală
  const getUserById = useCallback((id) => {
    return users.find(user => user.id === id || user.resourceId === id) || null
  }, [users])

  // Adaugă un utilizator nou (optimism gestionat în Repository)
  const addUser = useCallback(async (userData) => {
    setLoading(true)
    setError(null)
    
    try {
      const newUser = await userService.addUser(userData)
      const ui = userManager.transformUserForUI(newUser)
      const idx = sharedUsers.findIndex(u => u.id === ui.id || u.resourceId === ui.resourceId)
      if (idx >= 0) sharedUsers[idx] = { ...ui, _isOptimistic: false }
      else sharedUsers = [ui, ...sharedUsers]
      sharedUserCount = sharedUsers.length
      notifySubscribers()
      return ui
    } catch (err) {
      setError(err.message)
      console.error('Error adding user:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizează un utilizator (optimism gestionat în Repository)
  const updateUser = useCallback(async (id, userData) => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedUser = await userService.updateUser(id, userData)
      const ui = userManager.transformUserForUI(updatedUser)
      const existingIndex = sharedUsers.findIndex(user => user.id === id || user.resourceId === id)
      if (existingIndex >= 0) sharedUsers[existingIndex] = { ...ui, _isOptimistic: false }
      notifySubscribers()
      return ui
    } catch (err) {
      setError(err.message)
      console.error('Error updating user:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Șterge un utilizator (optimism gestionat în Repository)
  const deleteUser = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      await userService.deleteUser(id)
      sharedUsers = sharedUsers.filter(u => (u.id !== id && u.resourceId !== id))
      sharedUserCount = sharedUsers.length
      notifySubscribers()
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
      console.log(`searchUsers - Found ${searchResults.length} users for query "${query}"`, searchResults)
      
      // Actualizează starea partajată
      sharedUsers = searchResults
      sharedUserCount = searchResults.length
      notifySubscribers()
      
      return searchResults
    } catch (err) {
      // Încearcă să încarce din cache local dacă API-ul eșuează
      try {
        console.warn('API failed, trying local cache:', err.message)
        const cachedData = await indexedDb.getAll('users')
        
        const searchTermLower = query.toLowerCase()
        const filteredData = cachedData.filter(user => 
          user.name?.toLowerCase().includes(searchTermLower) ||
          user.email?.toLowerCase().includes(searchTermLower) ||
          (user.phone && user.phone.includes(query))
        ).slice(0, limit)
        
        // Actualizează starea partajată
        sharedUsers = filteredData
        sharedUserCount = filteredData.length
        notifySubscribers()
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        return filteredData
      } catch (cacheErr) {
        setError(err.message)
        console.error('Error searching users:', err)
        return []
      }
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
      sharedStats = userStats
      notifySubscribers()
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
      
      sharedUsers = []
      sharedUserCount = 0
      sharedStats = null
      notifySubscribers()
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
