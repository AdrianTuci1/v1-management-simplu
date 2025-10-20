import { useState, useEffect, useCallback } from 'react'
import { onResourceMessage } from '../data/infrastructure/websocketClient.js'
import { agentLogService } from '../services/agentLogService.js'
import { useHealthRepository } from './useHealthRepository.js'

// Shared state for all instances
let sharedLogs = []
let subscribers = new Set()

function notifySubscribers() {
  console.log('🔔 Notifying agent logs subscribers. Count:', subscribers.size, 'Logs count:', sharedLogs.length)
  subscribers.forEach(cb => cb([...sharedLogs]))
}

export const useAgentLogs = () => {
  const [logs, setLogs] = useState(sharedLogs)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { canMakeRequests, isOffline } = useHealthRepository()

  // Funcție pentru transformarea datelor pentru UI
  const transformLogForUI = useCallback((log) => {
    // Extrage datele din structura backend
    const data = log.data || {}
    const metadata = data.metadata || {}
    
    // Mapează subAction la acțiune vizibilă pentru UI
    const getActionFromSubAction = (subAction) => {
      if (subAction === 'send') return 'POST'
      if (subAction === 'receive') return 'GET'
      if (subAction === 'failed') return 'DELETE'
      if (subAction === 'call_ended') return 'PATCH'
      return 'POST'
    }
    
    // Mapează triggeredBy la numele agentului
    const getAgentName = (triggeredBy) => {
      if (triggeredBy === 'elevenlabs') return 'ElevenLabs'
      if (triggeredBy === 'bedrock_agent') return 'Bedrock Agent'
      return triggeredBy || 'Agent'
    }
    
    // Generează descriere automată bazată pe actionType și subAction
    const generateDescription = (actionType, subAction, triggeredBy) => {
      const agentName = getAgentName(triggeredBy)
      
      if (actionType === 'voice_call') {
        if (subAction === 'call_ended') return `${agentName} - Apel vocal finalizat`
        return `${agentName} - Apel vocal`
      }
      if (actionType === 'sms') {
        if (subAction === 'send') return `${agentName} - SMS trimis`
        if (subAction === 'failed') return `${agentName} - SMS eșuat`
        return `${agentName} - SMS`
      }
      if (actionType === 'email') {
        if (subAction === 'send') return `${agentName} - Email trimis`
        if (subAction === 'failed') return `${agentName} - Email eșuat`
        return `${agentName} - Email`
      }
      if (actionType === 'meta_message') {
        if (subAction === 'send') return `${agentName} - Mesaj social media`
        if (subAction === 'receive') return `${agentName} - Mesaj primit`
        return `${agentName} - Social media`
      }
      return `${agentName} - ${actionType}`
    }
    
    // Generează detalii despre log
    const generateDetails = (metadata, actionType, data) => {
      if (actionType === 'voice_call') {
        const duration = metadata.callDuration || 0
        const messages = metadata.transcriptLength || 0
        return `Durată: ${duration}s, ${messages} mesaje în transcript`
      }
      if (actionType === 'sms' || actionType === 'email') {
        const recipient = data.recipient?.phone || data.recipient?.email || data.recipient?.name || 'destinatar necunoscut'
        const status = metadata.deliveryStatus || 'trimis'
        return `Către: ${recipient}, Status: ${status}`
      }
      if (actionType === 'meta_message') {
        const recipient = data.recipient?.name || data.recipient?.userId || 'utilizator'
        return `Conversație cu ${recipient}`
      }
      return metadata.deliveryStatus || 'Procesată cu succes'
    }
    
    // Determină statusul bazat pe metadata
    const getStatus = (metadata, subAction) => {
      if (subAction === 'failed' || metadata.status === 'failed' || metadata.deliveryStatus === 'failed') {
        return 'error'
      }
      if (metadata.status === 'done' || metadata.deliveryStatus === 'delivered' || metadata.deliveryStatus === 'sent') {
        return 'success'
      }
      if (metadata.deliveryStatus === 'pending') {
        return 'pending'
      }
      return 'success'
    }
    
    // Determină categoria bazată pe actionType
    const getCategory = (actionType) => {
      if (actionType === 'voice_call') return 'appointment'
      if (actionType === 'sms' || actionType === 'email') return 'communication'
      if (actionType === 'meta_message') return 'social'
      return 'communication'
    }
    
    // Determină prioritatea
    const getPriority = (subAction, metadata) => {
      if (subAction === 'failed' || metadata.status === 'failed') return 'high'
      if (metadata.deliveryStatus === 'pending') return 'medium'
      return 'low'
    }
    
    // Transformă în format UI
    return {
      id: log.id || log.resourceId,
      resourceId: log.resourceId || log.id,
      timestamp: log.timestamp ? new Date(log.timestamp) : (metadata.startTime ? new Date(metadata.startTime * 1000) : new Date()),
      action: getActionFromSubAction(data.subAction),
      // IMPORTANT: folosim actionType pentru iconița acțiunii (nu provider)
      service: data.actionType, // 'sms', 'email', 'voice_call', 'meta_message'
      description: generateDescription(data.actionType, data.subAction, data.triggeredBy),
      details: generateDetails(metadata, data.actionType, data),
      status: getStatus(metadata, data.subAction),
      priority: getPriority(data.subAction, metadata),
      category: getCategory(data.actionType),
      // Date originale pentru detalii
      actionType: data.actionType,
      subAction: data.subAction,
      agentSessionId: data.agentSessionId,
      triggeredBy: data.triggeredBy,
      provider: data.provider,
      externalId: data.externalId,
      recipient: data.recipient,
      relatedResourceType: data.relatedResourceType,
      relatedResourceId: data.relatedResourceId,
      metadata: metadata,
      // Context pentru backwards compatibility
      context: {
        conversationId: metadata.conversationId,
        callDuration: metadata.callDuration,
        cost: metadata.cost,
        transcriptAvailable: metadata.transcriptAvailable,
        recipient: data.recipient
      },
      // Păstrează toate datele originale
      _rawData: log.data
    }
  }, [])

  // Funcție pentru încărcarea log-urilor cu paginare și filtre
  const loadAgentLogs = useCallback(async (page = 1, limit = 50, filters = {}) => {
    // Verifică dacă putem face request-uri
    if (!canMakeRequests) {
      setError('Log-urile nu sunt vizibile în modul offline')
      setLoading(false)
      console.log('⚠️ Cannot load agent logs: offline mode')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Folosește serviciul pentru a încărca datele
      const data = await agentLogService.getAgentLogs({
        page,
        limit,
        ...filters
      })
      
      console.log(`✅ Loaded agent logs (page ${page}, limit ${limit}):`, data.length, filters)
      
      const transformedData = data.map(log => transformLogForUI(log))
      sharedLogs = transformedData
      setLogs([...transformedData])
      notifySubscribers()
    } catch (err) {
      if (isOffline) {
        setError('Log-urile nu sunt vizibile în modul offline')
      } else {
        setError('Nu s-au putut încărca log-urile. Verifică conexiunea la server.')
      }
      console.error('Error loading agent logs:', err)
    } finally {
      setLoading(false)
    }
  }, [transformLogForUI, canMakeRequests, isOffline])

  // Funcție pentru obținerea unui log după ID
  const getLogById = useCallback(async (id) => {
    try {
      const data = await agentLogService.getAgentLogById(id)
      return transformLogForUI(data)
    } catch (err) {
      setError(err.message)
      console.error('Error getting log by ID:', err)
      throw err
    }
  }, [transformLogForUI])

  // Subscribe la actualizări WebSocket la montare
  useEffect(() => {
    // Initialize from shared state and subscribe to updates
    setLogs([...sharedLogs])
    
    // Adaugă subscriber pentru actualizări
    const subscriber = (newLogs) => {
      console.log('🔄 Agent logs subscriber called with logs count:', newLogs.length)
      setLogs(newLogs)
    }
    subscribers.add(subscriber)
    const unsub = () => subscribers.delete(subscriber)
    
    // Subscribe la actualizări prin WebSocket pentru agent-logs
    const handler = async (message) => {
      const { type, data, resourceType } = message
      
      // Verifică dacă mesajul este pentru agent-logs
      if (resourceType !== 'agent-logs' && resourceType !== 'agent-log' && resourceType !== 'agent_log') return
      
      const operation = type?.replace('resource_', '') || type
      const id = data?.id || data?.resourceId
      if (!id) return
      
      try {
        if (operation === 'created' || operation === 'create') {
          // Adaugă noul log
          const ui = transformLogForUI({ ...data, id, resourceId: id })
          
          // Verifică dacă nu există deja (evită dubluri)
          const existingIndex = sharedLogs.findIndex(l => l.id === id || l.resourceId === id)
          if (existingIndex >= 0) {
            sharedLogs[existingIndex] = ui
          } else {
            // Adaugă la început (cel mai recent)
            sharedLogs = [ui, ...sharedLogs]
          }
          
          setLogs([...sharedLogs])
          notifySubscribers()
          console.log('✅ Agent log created via WebSocket:', id)
        } else if (operation === 'updated' || operation === 'update') {
          // Actualizează log-ul existent
          const ui = transformLogForUI({ ...data, id, resourceId: id })
          const existingIndex = sharedLogs.findIndex(l => 
            l.id === id || l.resourceId === id
          )
          if (existingIndex >= 0) {
            sharedLogs[existingIndex] = ui
            setLogs([...sharedLogs])
            notifySubscribers()
            console.log('✅ Agent log updated via WebSocket:', id)
          }
        } else if (operation === 'deleted' || operation === 'delete') {
          // Elimină log-ul din lista locală
          sharedLogs = sharedLogs.filter(l => {
            const matches = l.id === id || l.resourceId === id
            return !matches
          })
          setLogs([...sharedLogs])
          notifySubscribers()
          console.log('✅ Agent log deleted via WebSocket:', id)
        }
      } catch (error) {
        console.error('❌ Error handling agent log WebSocket message:', error)
      }
    }
    
    // Subscribe la toate variantele de nume (plural este principal)
    const unsubPlural = onResourceMessage('agent-logs', handler)
    const unsubSingular = onResourceMessage('agent-log', handler)
    const unsubUnderscore = onResourceMessage('agent_log', handler)
    const unsubUnderscorePlural = onResourceMessage('agent_logs', handler)
    
    return () => { 
      unsubPlural()
      unsubSingular()
      unsubUnderscore()
      unsubUnderscorePlural()
      unsub() 
    }
  }, [transformLogForUI])

  return {
    logs,
    loading,
    error,
    loadAgentLogs,
    getLogById,
    // Expune și statusul offline pentru UI
    isOffline,
    canMakeRequests
  }
}

