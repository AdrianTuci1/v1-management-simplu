import { useState, useEffect, useCallback } from 'react';
import { dataFacade } from '../data/DataFacade.js';

/**
 * Hook pentru accesul la DataFacade
 * Oferă o interfață React-friendly pentru toate funcționalitățile din data layer
 */
export function useDataFacade() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [websocketStatus, setWebsocketStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState({
    isOnline: navigator.onLine,
    serverHealth: 'unknown',
    lastCheck: null,
    canMakeRequests: false
  });

  useEffect(() => {
    // Inițializează facade-ul
    dataFacade.initialize()
      .then(() => {
        setIsInitialized(true);
        setError(null);
      })
      .catch(err => {
        setError(err);
        console.error('Failed to initialize DataFacade:', err);
      });

    // Abonează-te la statusul WebSocket
    const unsubscribeWebSocket = dataFacade.onWebSocketMessage((message) => {
      if (message.type === 'connection') {
        setWebsocketStatus(message.status);
      }
    });

    // Abonează-te la schimbările de health status
    const unsubscribeHealth = dataFacade.onHealthChange((newHealthStatus) => {
      setHealthStatus(newHealthStatus);
    });

    return () => {
      unsubscribeWebSocket();
      unsubscribeHealth();
    };
  }, []);

  // CRUD Operations
  const create = useCallback(async (resourceType, data) => {
    try {
      return await dataFacade.create(resourceType, data);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const update = useCallback(async (resourceType, id, data) => {
    try {
      return await dataFacade.update(resourceType, id, data);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const remove = useCallback(async (resourceType, id) => {
    try {
      return await dataFacade.delete(resourceType, id);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const getById = useCallback(async (resourceType, id) => {
    try {
      return await dataFacade.getById(resourceType, id);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const getAll = useCallback(async (resourceType, params = {}) => {
    try {
      return await dataFacade.getAll(resourceType, params);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Command Operations
  const executeCommand = useCallback(async (operation, resourceType, data, id = null) => {
    try {
      return await dataFacade.executeCommand(operation, resourceType, data, id);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // WebSocket Operations
  const connectWebSocket = useCallback((url) => {
    dataFacade.connectWebSocket(url);
  }, []);

  const sendMessage = useCallback((event, payload) => {
    dataFacade.sendWebSocketMessage(event, payload);
  }, []);

  // Draft Operations (Future)
  const createDraft = useCallback(async (resourceType, data) => {
    try {
      return await dataFacade.createDraft(resourceType, data);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const updateDraft = useCallback(async (draftId, data) => {
    try {
      return await dataFacade.updateDraft(draftId, data);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const commitDraft = useCallback(async (draftId) => {
    try {
      return await dataFacade.commitDraft(draftId);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const cancelDraft = useCallback(async (draftId) => {
    try {
      return await dataFacade.cancelDraft(draftId);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Agent Operations (Future)
  const authenticateAgent = useCallback(async (agentId, apiKey) => {
    try {
      return await dataFacade.authenticateAgent(agentId, apiKey);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const executeAgentCommand = useCallback(async (sessionId, command) => {
    try {
      return await dataFacade.executeAgentCommand(sessionId, command);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const modifyQueryFromAgent = useCallback(async (sessionId, resourceType, modifications) => {
    try {
      return await dataFacade.modifyQueryFromAgent(sessionId, resourceType, modifications);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Utility
  const getSystemInfo = useCallback(() => {
    return dataFacade.getSystemInfo();
  }, []);

  const isResourceTypeSupported = useCallback((resourceType) => {
    return dataFacade.isResourceTypeSupported(resourceType);
  }, []);

  const getSupportedResourceTypes = useCallback(() => {
    return dataFacade.getSupportedResourceTypes();
  }, []);

  return {
    // State
    isInitialized,
    websocketStatus,
    error,
    healthStatus,
    
    // Health Status Helpers
    isHealthy: healthStatus.isOnline && healthStatus.serverHealth === 'healthy',
    isOffline: !healthStatus.isOnline,
    isServerDown: healthStatus.isOnline && healthStatus.serverHealth === 'unhealthy',
    canMakeRequests: healthStatus.canMakeRequests,
    
    // CRUD Operations
    create,
    update,
    remove,
    getById,
    getAll,
    
    // Command Operations
    executeCommand,
    
    // WebSocket Operations
    connectWebSocket,
    sendMessage,
    
    // Draft Operations
    createDraft,
    updateDraft,
    commitDraft,
    cancelDraft,
    
    // Agent Operations
    authenticateAgent,
    executeAgentCommand,
    modifyQueryFromAgent,
    
    // Utility
    getSystemInfo,
    isResourceTypeSupported,
    getSupportedResourceTypes
  };
}
