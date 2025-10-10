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
        console.log('📊 Loading business statistics from IndexedDB cache...')
        const cached = await indexedDb.table('statistics').get('business-statistics')
        console.log('📊 Cached statistics found:', cached)
        if (cached && cached.data) {
          console.log('✅ Using cached business statistics:', cached.data)
          setBusinessStatistics(cached.data)
          setError('Conectare la server eșuată. Se afișează datele din cache local.')
          return cached.data
        } else {
          console.warn('⚠️ No cached business statistics found')
        }
      } catch (cacheErr) {
        console.warn('❌ Failed to load cached business statistics:', cacheErr)
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
      const response = await invoker.getRecentActivities()
      
      // Extract data from new API format: { success, data, meta }
      const data = response?.data || response || []
      
      setRecentActivities(data)
      setLastUpdated(new Date().toISOString())
      return data
    } catch (err) {
      console.error('Error loading recent activities:', err)
      setError('Eroare la încărcarea activităților recente')
      
      // Try to load from local cache as fallback
      try {
        console.log('📋 Loading recent activities from IndexedDB cache...')
        const cached = await indexedDb.table('statistics').get('recent-activities')
        console.log('📋 Cached activities found:', cached)
        if (cached && cached.data) {
          console.log('✅ Using cached recent activities:', cached.data)
          setRecentActivities(cached.data)
          setError('Conectare la server eșuată. Se afișează datele din cache local.')
          return cached.data
        } else {
          console.warn('⚠️ No cached recent activities found')
        }
      } catch (cacheErr) {
        console.warn('❌ Failed to load cached recent activities:', cacheErr)
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
      const [statsResponse, activitiesResponse] = await Promise.all([
        invoker.getBusinessStatistics(),
        invoker.getRecentActivities()
      ])
      
      // Extract data from new API format: { success, data, meta }
      const statsData = statsResponse?.data || statsResponse
      const activitiesData = activitiesResponse?.data || activitiesResponse || []
      
      // 🔍 DEBUG: Afișează răspunsurile în consolă
      console.group('📊 Statistics Response')
      console.log('Raw statsResponse:', statsResponse)
      console.log('Processed statsData:', statsData)
      console.groupEnd()
      
      console.group('📋 Activities Response')
      console.log('Raw activitiesResponse:', activitiesResponse)
      console.log('Processed activitiesData:', activitiesData)
      console.log('Number of activities:', activitiesData.length)
      console.groupEnd()
      
      setBusinessStatistics(statsData)
      setRecentActivities(activitiesData)
      setLastUpdated(new Date().toISOString())
      
      return { businessStatistics: statsData, recentActivities: activitiesData }
    } catch (err) {
      console.error('Error loading all statistics:', err)
      setError('Eroare la încărcarea datelor statistice')
      
      // Try to load from local cache as fallback
      try {
        console.log('📊📋 Loading statistics from IndexedDB cache...')
        const [cachedStats, cachedActivities] = await Promise.all([
          indexedDb.table('statistics').get('business-statistics'),
          indexedDb.table('statistics').get('recent-activities')
        ])
        
        console.log('📊 Cached stats:', cachedStats)
        console.log('📋 Cached activities:', cachedActivities)
        
        if (cachedStats && cachedStats.data) {
          console.log('✅ Using cached business statistics')
          setBusinessStatistics(cachedStats.data)
        } else {
          console.warn('⚠️ No cached business statistics')
        }
        
        if (cachedActivities && cachedActivities.data) {
          console.log('✅ Using cached recent activities:', cachedActivities.data.length, 'activities')
          setRecentActivities(cachedActivities.data)
        } else {
          console.warn('⚠️ No cached recent activities')
        }
        
        if (cachedStats || cachedActivities) {
          setError('Conectare la server eșuată. Se afișează datele din cache local.')
        }
      } catch (cacheErr) {
        console.warn('❌ Failed to load cached statistics:', cacheErr)
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
