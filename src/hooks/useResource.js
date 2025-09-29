import { useState, useEffect, useCallback, useRef } from 'react'
import { dataFacade } from '../data/DataFacade.js'
import { socketFacade } from '../data/SocketFacade.js'

// Generic resource hook that:
// - loads data via DataFacade (with offline fallback handled in repositories)
// - subscribes to websocket resource updates via SocketFacade
// - applies optional transform for UI
// - supports simple refetch with custom params
export function useResource(resourceType, options = {}) {
  const { initialParams = {}, transform = (x) => x, wsTypes = [resourceType] } = options

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const paramsRef = useRef(initialParams)

  const applyTransform = useCallback((items) => {
    try {
      return Array.isArray(items) ? items.map(transform) : []
    } catch (_) {
      return Array.isArray(items) ? items : []
    }
  }, [transform])

  const load = useCallback(async (nextParams) => {
    setLoading(true)
    setError(null)
    if (nextParams) paramsRef.current = nextParams
    try {
      const result = await dataFacade.getAll(resourceType, paramsRef.current)
      setData(applyTransform(result))
      return result
    } catch (err) {
      setError(err.message || String(err))
      setData([])
      return []
    } finally {
      setLoading(false)
    }
  }, [resourceType, applyTransform])

  // WebSocket updates
  useEffect(() => {
    // Ensure facade initialized once
    try { socketFacade.initialize() } catch (_) {}

    const handler = (message) => {
      const { type, data: payload, data: { resourceType: rt } = {} } = message || {}
      if (!payload) return
      // Accept both explicit wsTypes and resourceType in payload
      const matchesType = wsTypes.includes(rt) || wsTypes.includes(resourceType)
      if (!matchesType) return

      const op = (type || '').replace('resource_', '')
      const id = payload.id || payload.resourceId
      if (!id) return

      setData((prev) => {
        if (op === 'created' || op === 'create') {
          const exists = prev.findIndex((i) => (i.id === id || i.resourceId === id)) >= 0
          if (exists) return prev
          return [transform({ ...payload, id, resourceId: id }), ...prev]
        }
        if (op === 'updated' || op === 'update') {
          return prev.map((i) => (i.id === id || i.resourceId === id)
            ? transform({ ...i, ...payload, id, resourceId: id })
            : i)
        }
        if (op === 'deleted' || op === 'delete') {
          return prev.filter((i) => (i.id !== id && i.resourceId !== id))
        }
        return prev
      })
    }

    // Subscribe for each wsType provided
    const unsubs = wsTypes.map((t) => socketFacade.onResourceMessage(t, handler))
    return () => { unsubs.forEach((u) => { try { u() } catch (_) {} }) }
  }, [resourceType, wsTypes, transform])

  // Initial load
  useEffect(() => {
    load(initialParams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    data,
    loading,
    error,
    reload: (nextParams) => load(nextParams ?? paramsRef.current),
    setParams: (nextParams) => { paramsRef.current = nextParams },
  }
}

export default useResource


