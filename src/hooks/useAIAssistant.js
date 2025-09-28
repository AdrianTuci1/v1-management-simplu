import { useState, useEffect, useRef, useCallback } from 'react';
import { createAIAssistantService } from '../services/aiAssistantService';
import { createAIWebSocketService } from '../services/aiWebSocketService';
import { getConfig } from '../config/aiAssistantConfig';

export const useAIAssistant = (businessId = null, userId = null, locationId = null) => {
  // Check if we're in demo mode
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  
  // Use default values if not provided
  const finalBusinessId = businessId || getConfig('DEFAULTS.BUSINESS_ID');
  const finalUserId = userId || getConfig('DEFAULTS.USER_ID');
  const finalLocationId = locationId || getConfig('DEFAULTS.LOCATION_ID');

  // State
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Refs for services
  const aiServiceRef = useRef(null);
  const webSocketRef = useRef(null);

  // Initialize services
  const initializeServices = useCallback(async () => {
    try {
      setError(null);
      setConnectionStatus('connecting');

      // Create AI Assistant Service
      aiServiceRef.current = createAIAssistantService(finalBusinessId, finalUserId, finalLocationId);
      
      // Create WebSocket Service only if not in demo mode
      if (!isDemoMode) {
        webSocketRef.current = createAIWebSocketService(finalBusinessId, finalUserId, finalLocationId);
      }
      
      // Set up AI Service event handlers
      aiServiceRef.current.onMessageReceived = (newMessages) => {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.messageId));
          const filteredNew = newMessages.filter(m => !existingIds.has(m.messageId));
          return [...prev, ...filteredNew];
        });
      };
      
      aiServiceRef.current.onSessionChange = (sessionId) => {
        setCurrentSessionId(sessionId);
        // Also set session ID in WebSocket service
        if (webSocketRef.current) {
          webSocketRef.current.setCurrentSessionId(sessionId);
        }
      };
      
      aiServiceRef.current.onError = (message, error) => {
        setError({ message, error });
      };
      
      // Set up WebSocket event handlers only if not in demo mode
      if (!isDemoMode && webSocketRef.current) {
        webSocketRef.current.onMessageReceived = (newMessages) => {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.messageId));
            const filteredNew = newMessages.filter(m => !existingIds.has(m.messageId));
            return [...prev, ...filteredNew];
          });
        };
        
        webSocketRef.current.onConnectionChange = (connected) => {
          setIsConnected(connected);
          setConnectionStatus(connected ? 'connected' : 'disconnected');
        };
        
        webSocketRef.current.onError = (message, error) => {
          setError({ message, error });
        };
      }
      
      // Load today's session
      if (aiServiceRef.current) {
        await aiServiceRef.current.loadTodaySession();
      }
      
      // Connect to WebSocket only if not in demo mode
      if (!isDemoMode && webSocketRef.current) {
        await webSocketRef.current.connect();
      }

      // In demo mode, set connected status to true
      if (isDemoMode) {
        setIsConnected(true);
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('connected');
      }
    } catch (error) {
      setError({ message: 'Failed to initialize services', error });
      setConnectionStatus('error');
    }
  }, [finalBusinessId, finalUserId, finalLocationId]);

  // Cleanup services
  const cleanupServices = useCallback(() => {
    if (aiServiceRef.current) {
      aiServiceRef.current.dispose();
      aiServiceRef.current = null;
    }
    
    if (webSocketRef.current) {
      webSocketRef.current.dispose();
      webSocketRef.current = null;
    }
    
    setMessages([]);
    setCurrentSessionId(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setError(null);
  }, []);

  // Send message
  const sendMessage = useCallback(async (content, context = {}) => {
    if (!content || !content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    setIsLoading(true);
    setError(null);

    // Create user message with unique ID - declare outside try block so it's accessible in catch
    const messageId = `user_${Date.now()}`;
    const userMessage = {
      messageId: messageId,
      sessionId: currentSessionId,
      businessId: finalBusinessId,
      userId: finalUserId,
      content: content.trim(),
      type: 'user',
      timestamp: new Date().toISOString(),
      metadata: { source: 'api' }
    };

    try {
      // Add user message to UI immediately
      setMessages(prev => [...prev, userMessage]);

      // Try WebSocket first (if not in demo mode), fallback to API
      if (!isDemoMode && webSocketRef.current && webSocketRef.current.isConnected) {
        await webSocketRef.current.sendMessage(content.trim(), context);
      } else if (aiServiceRef.current) {
        await aiServiceRef.current.sendMessage(content.trim(), context);
      } else {
        throw new Error('No service available to send message');
      }

      return { success: true, messageId: userMessage.messageId };
    } catch (error) {
      setError({ message: 'Failed to send message', error });
      
      // Remove the user message if sending failed using the correct messageId
      setMessages(prev => prev.filter(m => m.messageId !== messageId));
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, finalBusinessId, finalUserId]);

  // Search messages
  const searchMessages = useCallback(async (query, limit = 20) => {
    if (!aiServiceRef.current) {
      throw new Error('AI Service not initialized');
    }

    try {
      return await aiServiceRef.current.searchMessages(query, limit);
    } catch (error) {
      setError({ message: 'Search failed', error });
      throw error;
    }
  }, []);

  // Export session
  const exportSession = useCallback(async (format = 'json') => {
    if (!aiServiceRef.current) {
      throw new Error('AI Service not initialized');
    }

    try {
      return await aiServiceRef.current.exportSession(format);
    } catch (error) {
      setError({ message: 'Export failed', error });
      throw error;
    }
  }, []);

  // Close session
  const closeSession = useCallback(async (status = 'resolved') => {
    if (!aiServiceRef.current) {
      throw new Error('AI Service not initialized');
    }

    try {
      await aiServiceRef.current.closeSession(status);
      setMessages([]);
      setCurrentSessionId(null);
      return true;
    } catch (error) {
      setError({ message: 'Failed to close session', error });
      throw error;
    }
  }, []);

  // Get session statistics
  const getSessionStats = useCallback(async () => {
    if (!aiServiceRef.current) {
      throw new Error('AI Service not initialized');
    }

    try {
      return await aiServiceRef.current.getSessionStats();
    } catch (error) {
      setError({ message: 'Failed to get session statistics', error });
      throw error;
    }
  }, []);

  // Get active sessions
  const getActiveSessions = useCallback(async () => {
    if (!aiServiceRef.current) {
      throw new Error('AI Service not initialized');
    }

    try {
      return await aiServiceRef.current.getActiveSessions();
    } catch (error) {
      setError({ message: 'Failed to get active sessions', error });
      throw error;
    }
  }, []);

  // Get active session for current user
  const getActiveSessionForUser = useCallback(async () => {
    if (!aiServiceRef.current) {
      throw new Error('AI Service not initialized');
    }

    try {
      return await aiServiceRef.current.getActiveSessionForUser();
    } catch (error) {
      setError({ message: 'Failed to get active session for user', error });
      throw error;
    }
  }, []);

  // Get user session history
  const getUserSessionHistory = useCallback(async (limit = 20) => {
    if (!aiServiceRef.current) {
      throw new Error('AI Service not initialized');
    }

    try {
      return await aiServiceRef.current.getUserSessionHistory(limit);
    } catch (error) {
      setError({ message: 'Failed to get user session history', error });
      throw error;
    }
  }, []);

  // Get session by ID
  const getSessionById = useCallback(async (sessionId) => {
    if (!aiServiceRef.current) {
      throw new Error('AI Service not initialized');
    }

    try {
      return await aiServiceRef.current.getSessionById(sessionId);
    } catch (error) {
      setError({ message: 'Failed to get session by ID', error });
      throw error;
    }
  }, []);

  // Load specific session
  const loadSession = useCallback(async (sessionId) => {
    if (!aiServiceRef.current) {
      throw new Error('AI Service not initialized');
    }

    try {
      const sessionData = await aiServiceRef.current.loadSession(sessionId);
      
      if (sessionData) {
        setCurrentSessionId(sessionId);
        setMessages(sessionData.messages || []);
      }
      
      return sessionData;
    } catch (error) {
      setError({ message: 'Failed to load session', error });
      throw error;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reconnect
  const reconnect = useCallback(async () => {
    cleanupServices();
    await initializeServices();
  }, [cleanupServices, initializeServices]);

  // Get connection status details
  const getConnectionStatus = useCallback(() => {
    if (webSocketRef.current) {
      return webSocketRef.current.getConnectionStatus();
    }
    return {
      isConnected: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: getConfig('WEBSOCKET.MAX_RECONNECT_ATTEMPTS'),
      hasChannel: false
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeServices();
    
    return () => {
      cleanupServices();
    };
  }, [initializeServices, cleanupServices]);

  return {
    // State
    messages,
    isConnected,
    currentSessionId,
    isLoading,
    error,
    connectionStatus,
    
    // Actions
    sendMessage,
    searchMessages,
    exportSession,
    closeSession,
    getSessionStats,
    getActiveSessions,
    getActiveSessionForUser,
    getUserSessionHistory,
    getSessionById,
    loadSession,
    clearError,
    reconnect,
    
    // Utilities
    getConnectionStatus,
    
    // Service references (for advanced usage)
    aiService: aiServiceRef.current,
    webSocket: webSocketRef.current
  };
};

// Hook for managing AI Assistant configuration
export const useAIAssistantConfig = () => {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('aiAssistantConfig');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = key.split('.');
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      // Save to localStorage
      try {
      localStorage.setItem('aiAssistantConfig', JSON.stringify(newConfig));
    } catch (error) {
      // Silent fail for configuration save
    }
      
      return newConfig;
    });
  }, []);

  const resetConfig = useCallback(() => {
    try {
      localStorage.removeItem('aiAssistantConfig');
    } catch (error) {
      // Silent fail for configuration reset
    }
    setConfig({});
  }, []);

  return {
    config,
    updateConfig,
    resetConfig
  };
};

// Hook for managing AI Assistant sessions
export const useAIAssistantSessions = (businessId = null, userId = null) => {
  const [sessions, setSessions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadActiveSessions = useCallback(async () => {
    if (!businessId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const aiService = createAIAssistantService(businessId, userId);
      const activeSessions = await aiService.getActiveSessions();
      setSessions(activeSessions);
      aiService.dispose();
    } catch (error) {
      setError({ message: 'Failed to load active sessions', error });
    } finally {
      setIsLoading(false);
    }
  }, [businessId, userId]);

  const loadSessionHistory = useCallback(async (limit = 20) => {
    if (!businessId || !userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const aiService = createAIAssistantService(businessId, userId);
      const history = await aiService.getUserSessionHistory(limit);
      setSessionHistory(history.sessions || []);
      aiService.dispose();
      
      return history;
    } catch (error) {
      setError({ message: 'Failed to load session history', error });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [businessId, userId]);

  const getActiveSessionForUser = useCallback(async () => {
    if (!businessId || !userId) return null;
    
    try {
      const aiService = createAIAssistantService(businessId, userId);
      const activeSession = await aiService.getActiveSessionForUser();
      aiService.dispose();
      
      return activeSession;
    } catch (error) {
      setError({ message: 'Failed to get active session for user', error });
      throw error;
    }
  }, [businessId, userId]);

  const loadSession = useCallback(async (sessionId) => {
    if (!businessId || !userId) return null;
    
    try {
      const aiService = createAIAssistantService(businessId, userId);
      const sessionData = await aiService.loadSession(sessionId);
      aiService.dispose();
      
      return sessionData;
    } catch (error) {
      setError({ message: 'Failed to load session', error });
      throw error;
    }
  }, [businessId, userId]);

  const closeSession = useCallback(async (sessionId, status = 'resolved') => {
    if (!businessId) return;
    
    try {
      const aiService = createAIAssistantService(businessId, userId);
      await aiService.closeSession(status);
      aiService.dispose();
      
      // Remove from local state
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      setSessionHistory(prev => prev.filter(s => s.sessionId !== sessionId));
      
      return true;
    } catch (error) {
      setError({ message: 'Failed to close session', error });
      throw error;
    }
  }, [businessId, userId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (businessId) {
      loadActiveSessions();
    }
  }, [loadActiveSessions]);

  return {
    // State
    sessions,
    sessionHistory,
    isLoading,
    error,
    
    // Actions
    loadActiveSessions,
    loadSessionHistory,
    getActiveSessionForUser,
    loadSession,
    closeSession,
    clearError
  };
};
