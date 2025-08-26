import { useState, useCallback, useEffect } from 'react'
import StatisticsDataInvoker from '../data/invoker/StatisticsDataInvoker.js'
import { indexedDb } from '../data/infrastructure/db.js'

export const useStatistics = () => {
  const [businessStatistics, setBusinessStatistics] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const invoker = new StatisticsDataInvoker()

  // Load business statistics
  const loadBusinessStatistics = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await invoker.getBusinessStatistics()
      setBusinessStatistics(data)
      setLastUpdated(new Date().toISOString())
      return data
    } catch (err) {
      console.error('Error loading business statistics:', err)
      setError('Eroare la încărcarea statisticilor de business')
      
      // Try to load from local cache as fallback
      try {
        const cached = await indexedDb.table('statistics').get('business-statistics')
        if (cached && cached.data) {
          setBusinessStatistics(cached.data)
          setError('Conectare la server eșuată. Se afișează datele din cache local.')
          return cached.data
        }
      } catch (cacheErr) {
        console.warn('Failed to load cached business statistics:', cacheErr)
      }
      
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Load recent activities
  const loadRecentActivities = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await invoker.getRecentActivities()
      setRecentActivities(data)
      setLastUpdated(new Date().toISOString())
      return data
    } catch (err) {
      console.error('Error loading recent activities:', err)
      setError('Eroare la încărcarea activităților recente')
      
      // Try to load from local cache as fallback
      try {
        const cached = await indexedDb.table('statistics').get('recent-activities')
        if (cached && cached.data) {
          setRecentActivities(cached.data)
          setError('Conectare la server eșuată. Se afișează datele din cache local.')
          return cached.data
        }
      } catch (cacheErr) {
        console.warn('Failed to load cached recent activities:', cacheErr)
      }
      
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Load all statistics data
  const loadAllStatistics = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [statsData, activitiesData] = await Promise.all([
        invoker.getBusinessStatistics(),
        invoker.getRecentActivities()
      ])
      
      setBusinessStatistics(statsData)
      setRecentActivities(activitiesData)
      setLastUpdated(new Date().toISOString())
      
      return { businessStatistics: statsData, recentActivities: activitiesData }
    } catch (err) {
      console.error('Error loading all statistics:', err)
      setError('Eroare la încărcarea datelor statistice')
      
      // Try to load from local cache as fallback
      try {
        const [cachedStats, cachedActivities] = await Promise.all([
          indexedDb.table('statistics').get('business-statistics'),
          indexedDb.table('statistics').get('recent-activities')
        ])
        
        if (cachedStats && cachedStats.data) {
          setBusinessStatistics(cachedStats.data)
        }
        
        if (cachedActivities && cachedActivities.data) {
          setRecentActivities(cachedActivities.data)
        }
        
        if (cachedStats || cachedActivities) {
          setError('Conectare la server eșuată. Se afișează datele din cache local.')
        }
      } catch (cacheErr) {
        console.warn('Failed to load cached statistics:', cacheErr)
      }
      
      return { businessStatistics: null, recentActivities: [] }
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh data
  const refresh = useCallback(async () => {
    return await loadAllStatistics()
  }, [loadAllStatistics])

  // Auto-load data on mount
  useEffect(() => {
    loadAllStatistics()
  }, [loadAllStatistics])

  return {
    businessStatistics,
    recentActivities,
    loading,
    error,
    lastUpdated,
    loadBusinessStatistics,
    loadRecentActivities,
    loadAllStatistics,
    refresh
  }
}

export default useStatistics
