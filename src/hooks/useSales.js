import { useState, useEffect, useCallback } from 'react'
import { indexedDb } from '../data/infrastructure/db.js'
import { onResourceMessage } from '../data/infrastructure/websocketClient.js'
import { ResourceRepository } from '../data/repositories/ResourceRepository.js'
import { ResourceInvoker } from '../data/invoker/ResourceInvoker.js'
import { GetCommand } from '../data/commands/GetCommand.js'
import { AddCommand } from '../data/commands/AddCommand.js'
import { UpdateCommand } from '../data/commands/UpdateCommand.js'
import { DeleteCommand } from '../data/commands/DeleteCommand.js'

// Provisional Sales Hook with optimistic local cache and websocket reconciliation
export const useSales = () => {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const repository = new ResourceRepository('sale', 'sales')
  const invoker = new ResourceInvoker()

  const loadSales = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const command = new GetCommand(repository, filters)
      const result = await invoker.run(command)
      const data = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : [])
      setSales(data)
      return data
    } catch (err) {
      try {
        const cached = await indexedDb.getAll('sales')
        setSales(cached)
        setError('Conectare la server eșuată. Se afișează datele din cache local.')
        return cached
      } catch (cacheErr) {
        setError(err.message)
        return []
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const addSale = useCallback(async (saleData) => {
    setLoading(true)
    setError(null)
    try {
      const command = new AddCommand(repository, saleData)
      const created = await invoker.run(command)
      setSales(prev => [...prev, created])
      return created
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSale = useCallback(async (id, saleData) => {
    setLoading(true)
    setError(null)
    try {
      const command = new UpdateCommand(repository, id, saleData)
      const updated = await invoker.run(command)
      setSales(prev => prev.map(s => s.id === id ? updated : s))
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSale = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const command = new DeleteCommand(repository, id)
      await invoker.run(command)
      setSales(prev => prev.filter(s => s.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handler = async (message) => {
      const { type, data, resourceType } = message
      if (resourceType !== 'sales' && resourceType !== 'sale') return
      const operation = type?.replace('resource_', '') || type
      const id = data?.id || data?.resourceId
      if (!id) return
      if (operation === 'created' || operation === 'create') {
        setSales(prev => {
          const exists = prev.findIndex(s => s.id === id) >= 0
          return exists ? prev : [...prev, data]
        })
      } else if (operation === 'updated' || operation === 'update') {
        setSales(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)))
      } else if (operation === 'deleted' || operation === 'delete') {
        setSales(prev => prev.filter(s => s.id !== id))
      }
    }
    const unsubPlural = onResourceMessage('sales', handler)
    const unsubSingular = onResourceMessage('sale', handler)
    return () => { unsubPlural(); unsubSingular() }
  }, [])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  return {
    sales,
    loading,
    error,
    loadSales,
    addSale,
    updateSale,
    deleteSale
  }
}


