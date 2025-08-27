import { useState, useEffect, useCallback } from 'react'
import { indexedDb } from '../data/infrastructure/db.js'
import { onResourceMessage } from '../data/infrastructure/websocketClient.js'
import { generateTempId } from '../lib/utils.js'
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
      // optimistic fallback if request was accepted
      const tempId = generateTempId('sales')
      const optimistic = { ...saleData, id: tempId, resourceId: tempId, _tempId: tempId, _isOptimistic: true }
      await indexedDb.put('sales', optimistic)
      setSales(prev => [...prev, optimistic])
      return optimistic
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
      const tempId = generateTempId('sales')
      const optimistic = { ...saleData, id, resourceId: id, _tempId: tempId, _isOptimistic: true }
      await indexedDb.put('sales', optimistic)
      setSales(prev => prev.map(s => s.id === id ? optimistic : s))
      return optimistic
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
      await indexedDb.put('sales', { id, resourceId: id, _deleted: true, _isOptimistic: true })
      setSales(prev => prev.filter(s => s.id !== id))
      return true
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handler = async (message) => {
      const { type, data, tempId, realId, operation } = message
      if ((type && type.endsWith('_resolved')) || ['create','update','delete'].includes(operation)) {
        if (operation === 'create' || type === 'create_resolved') {
          if (tempId && realId) {
            await indexedDb.put('sales', { ...data, id: realId, resourceId: realId, _isOptimistic: false })
            setSales(prev => prev.map(s => (s._tempId === tempId ? { ...data, id: realId, resourceId: realId } : s)))
          }
        } else if (operation === 'update' || type === 'update_resolved') {
          if (realId) {
            await indexedDb.put('sales', { ...data, id: realId, resourceId: realId, _isOptimistic: false })
            setSales(prev => prev.map(s => (s.id === realId ? { ...s, ...data, resourceId: realId } : s)))
          }
        } else if (operation === 'delete' || type === 'delete_resolved') {
          if (realId) {
            await indexedDb.delete('sales', realId)
            setSales(prev => prev.filter(s => s.id !== realId))
          }
        }
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


