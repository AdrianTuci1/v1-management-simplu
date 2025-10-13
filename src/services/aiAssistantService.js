import { getConfig } from '../config/aiAssistantConfig';
import { aiApiRequest } from '../data/infrastructure/apiClient.js';
import { dataFacade } from '../data/DataFacade.js';
import { socketFacade } from '../data/SocketFacade.js';

// Logger utility
class Logger {
  static log(level, message, data = null) {
    if (!getConfig('LOGGING.ENABLED')) return;
    
    const logLevel = getConfig('LOGGING.LEVEL');
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    
    if (levels[level] >= levels[logLevel]) {
      const timestamp = new Date().toISOString();
      const logMessage = `[AI Assistant ${level.toUpperCase()}] ${timestamp}: ${message}`;
      
      if (getConfig('LOGGING.SHOW_CONSOLE')) {
        switch (level) {
          case 'debug':
            console.debug(logMessage, data);
            break;
          case 'info':
            console.info(logMessage, data);
            break;
          case 'warn':
            console.warn(logMessage, data);
            break;
          case 'error':
            console.error(logMessage, data);
            break;
        }
      }
    }
  }
}

// AI Assistant Service Class
export class AIAssistantService {
  constructor(businessId, userId, locationId = null) {
    this.businessId = businessId;
    this.userId = userId;
    this.locationId = locationId || getConfig('DEFAULTS.LOCATION_ID');
    this.currentSessionId = null;
    this.messageHistory = [];
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.heartbeatInterval = null;
    this.isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    
    // Event callbacks
    this.onMessageReceived = null;
    this.onConnectionChange = null;
    this.onSessionChange = null;
    this.onError = null;
    
    // DataFacade and SocketFacade integration
    this.dataFacade = dataFacade;
    this.socketFacade = socketFacade;
    
    Logger.log('info', 'AI Assistant Service initialized', { businessId, userId, locationId });
  }


  // Load active session for user (updated to match guide API)
  async loadActiveSession() {
    try {
      Logger.log('info', 'Loading active session for user');
      
      // In demo mode, return null (no active session)
      if (this.isDemoMode) {
        Logger.log('info', 'Demo mode - no active session');
        return null;
      }
      
      const endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/business/${this.businessId}/user/${this.userId}/active`;
      
      try {
        const activeSession = await aiApiRequest(endpoint);
        
        if (activeSession && activeSession.sessionId) {
          // Use existing active session
          this.currentSessionId = activeSession.sessionId;
          Logger.log('info', 'Found active session', { sessionId: this.currentSessionId });
          
          // Load message history for existing session
          await this.loadMessageHistory(this.currentSessionId);
          
          // Send session loaded event via SocketFacade
          this.socketFacade.sendAIAssistantSessionLoaded(this.businessId, this.userId, this.currentSessionId, this.locationId);
          
          // Notify session change
          this.onSessionChange?.(this.currentSessionId);
          
          return activeSession;
        } else {
          Logger.log('info', 'No active session found');
          return null;
        }
      } catch (error) {
        // 404 means no active session - this is normal
        if (error.status === 404) {
          Logger.log('info', 'No active session found (404)');
          return null;
        }
        throw error;
      }
    } catch (error) {
      Logger.log('error', 'Failed to load active session', error);
      // Don't throw error for missing sessions, just return null
      if (error.message.includes('404') || error.status === 404) {
        Logger.log('info', 'No active session exists, continuing...');
        return null;
      }
      this.onError?.(getConfig('ERRORS.SESSION_LOAD_FAILED'), error);
      throw error;
    }
  }

  // Load today's session (updated to load latest session)
  async loadTodaySession() {
    try {
      Logger.log('info', 'Loading latest session');
      
      // First, try to get active session for user
      const activeSession = await this.loadActiveSession();
      
      if (activeSession) {
        Logger.log('info', 'Active session found', { sessionId: this.currentSessionId });
        return this.currentSessionId;
      } else {
        // No active session found, try to load the latest session from history
        Logger.log('info', 'No active session found, loading latest session from history');
        
        try {
          const sessionHistory = await this.loadSessionHistory();
          
          if (sessionHistory && sessionHistory.length > 0) {
            // Get the most recent session (first in the list)
            const latestSession = sessionHistory[0];
            Logger.log('info', 'Latest session found', { 
              sessionId: latestSession.sessionId,
              createdAt: latestSession.createdAt,
              messageCount: latestSession.messageCount 
            });
            
            // Switch to the latest session
            await this.switchToSession(latestSession.sessionId);
            return this.currentSessionId;
          } else {
            // No sessions in history, create new one
            Logger.log('info', 'No sessions in history, creating new session');
            await this.startNewSession();
            return this.currentSessionId;
          }
        } catch (historyError) {
          Logger.log('warn', 'Failed to load session history, creating new session', historyError);
          await this.startNewSession();
          return this.currentSessionId;
        }
      }
    } catch (error) {
      Logger.log('error', 'Failed to load today session', error);
      this.onError?.(getConfig('ERRORS.SESSION_LOAD_FAILED'), error);
      throw error;
    }
  }

  // Load message history for a session (updated to match guide API)
  async loadMessageHistory(sessionId, limit = 50, before = null) {
    try {
      // In demo mode, return mock message history
      if (this.isDemoMode) {
        this.messageHistory = [
          {
            messageId: 'demo-msg-1',
            sessionId: sessionId,
            content: 'Bună! Sunt AI Assistant-ul în modul demo. Cum vă pot ajuta astăzi?',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            type: 'agent'
          }
        ];
        
        // Notify about loaded messages
        this.onMessageReceived?.(this.messageHistory);
        return this.messageHistory;
      }

      let endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/${sessionId}/messages`;
      
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);
      if (before) params.append('before', before);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      try {
        const messages = await aiApiRequest(endpoint);
        
        this.messageHistory = Array.isArray(messages) ? messages : [];
        
        Logger.log('info', 'Message history loaded', { 
          sessionId, 
          messageCount: this.messageHistory.length 
        });
        
        // Notify about loaded messages
        this.onMessageReceived?.(this.messageHistory);
        
        return this.messageHistory;
      } catch (error) {
        // 404 means no messages - this is normal for new sessions
        if (error.status === 404) {
          Logger.log('info', 'No messages found for session', { sessionId });
          this.messageHistory = [];
          this.onMessageReceived?.([]);
          return [];
        }
        throw error;
      }
    } catch (error) {
      Logger.log('error', 'Failed to load message history', error);
      this.onError?.(getConfig('ERRORS.SESSION_LOAD_FAILED'), error);
      throw error;
    }
  }

  // Send message to AI (fallback method when WebSocket is not available)
  async sendMessage(content, context = {}) {
    if (!content || content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    if (content.length > getConfig('MESSAGE.MAX_LENGTH')) {
      throw new Error(`Message too long. Maximum ${getConfig('MESSAGE.MAX_LENGTH')} characters allowed.`);
    }

    try {
      Logger.log('debug', 'Sending message via API (fallback method)', { content, context });

      // If no active session, create new one
      if (!this.currentSessionId) {
        await this.startNewSession();
      }

      const messagePayload = {
        tenant_id: this.businessId,
        user_id: this.userId,
        session_id: this.currentSessionId,
        message_id: `msg_${Date.now()}`,
        payload: {
          content: content.trim(),
          context: {
            businessId: this.businessId,
            locationId: this.locationId,
            userId: this.userId,
            timestamp: new Date().toISOString(),
            aiProcessing: true,
            ...context
          }
        },
        timestamp: new Date().toISOString(),
        type: 'agent.response'
      };

      const result = await aiApiRequest(getConfig('API_ENDPOINTS.MESSAGES'), {
        method: 'POST',
        body: JSON.stringify(messagePayload)
      });
      
      Logger.log('info', 'Message sent successfully via API', result);
      
      // Add user message to history
      const userMessage = {
        messageId: messagePayload.message_id,
        sessionId: this.currentSessionId,
        businessId: this.businessId,
        userId: this.userId,
        content: content.trim(),
        type: 'user',
        timestamp: messagePayload.timestamp,
        metadata: {
          source: 'api',
          ...messagePayload.payload.context
        }
      };
      
      this.messageHistory.push(userMessage);
      this.onMessageReceived?.([userMessage]);
      
      // Try to reload messages to get the updated conversation
      try {
        await this.loadMessageHistory(this.currentSessionId);
      } catch (historyError) {
        Logger.log('warn', 'Could not reload message history', historyError);
      }
      
      return result;
    } catch (error) {
      Logger.log('error', 'Failed to send message via API', error);
      this.onError?.(getConfig('ERRORS.MESSAGE_SEND_FAILED'), error);
      throw error;
    }
  }

  // Start new session (session will be created automatically when first message is sent)
  async startNewSession() {
    try {
      Logger.log('info', '🆕 Starting new session - will be created when first message is sent');
      
      // Clear current messages and session ID
      this.messageHistory = [];
      this.currentSessionId = null;
      
      // Notify UI that messages were cleared
      this.onMessageReceived?.([]);
      this.onSessionChange?.(null);
      
      // Generate a temporary session ID that will be replaced by backend when first message is sent
      const tempSessionId = `temp_${Date.now()}`;
      this.currentSessionId = tempSessionId;
      
      Logger.log('info', '✅ New session prepared with temp ID', { 
        tempSessionId,
        note: 'Real session ID will be received from backend after first message'
      });
      
      return { 
        success: true, 
        sessionId: tempSessionId,
        message: 'Session will be created when first message is sent via WebSocket'
      };
    } catch (error) {
      Logger.log('error', '❌ Failed to start new session', error);
      this.onError?.('Failed to start new session', error);
      throw error;
    }
  }

  // Switch to specific session (new method from guide)
  async switchToSession(sessionId) {
    try {
      Logger.log('info', 'Switching to session', { sessionId });
      
      const endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/${sessionId}`;
      const session = await aiApiRequest(endpoint);
      
      this.currentSessionId = sessionId;
      
      // Load message history for the session
      await this.loadMessageHistory(sessionId);
      
      // Send session loaded event via SocketFacade
      this.socketFacade.sendAIAssistantSessionLoaded(this.businessId, this.userId, sessionId, this.locationId);
      
      // Notify session change
      this.onSessionChange?.(sessionId);
      
      Logger.log('info', 'Switched to session successfully', { sessionId });
      return session;
    } catch (error) {
      Logger.log('error', 'Failed to switch session', error);
      this.onError?.('Failed to switch session', error);
      throw error;
    }
  }

  // Load session history for user (new method from guide)
  async loadSessionHistory(limit = 20) {
    try {
      Logger.log('info', 'Loading session history', { limit });
      
      const endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/business/${this.businessId}/user/${this.userId}/history?limit=${limit}`;
      
      try {
        const history = await aiApiRequest(endpoint);
        const historyArray = Array.isArray(history) ? history : [];
        
        Logger.log('info', 'Session history loaded', { count: historyArray.length });
        return historyArray;
      } catch (error) {
        // 404 means no session history - this is normal for new users
        if (error.status === 404) {
          Logger.log('info', 'No session history found');
          return [];
        }
        throw error;
      }
    } catch (error) {
      Logger.log('error', 'Failed to load session history', error);
      // Don't throw error for missing session history, just return empty array
      if (error.status === 404) {
        Logger.log('info', 'No session history exists, returning empty array');
        return [];
      }
      this.onError?.('Failed to load session history', error);
      throw error;
    }
  }

  // Get active sessions for business (updated to use direct API)
  async getActiveSessions() {
    try {
      // This would need to be implemented based on your backend API
      // For now, we'll use the session history as a fallback
      return await this.loadSessionHistory(50);
    } catch (error) {
      Logger.log('error', 'Failed to get active sessions', error);
      this.onError?.('Failed to retrieve active sessions', error);
      throw error;
    }
  }

  // Get active session for current user
  async getActiveSessionForUser() {
    try {
      return await this.dataFacade.getActiveAIAssistantSessionForUser(this.businessId, this.userId);
    } catch (error) {
      Logger.log('error', 'Failed to get active session for user', error);
      this.onError?.('Failed to retrieve active session for user', error);
      throw error;
    }
  }

  // Get user session history
  async getUserSessionHistory(limit = 20) {
    try {
      return await this.dataFacade.getUserAIAssistantSessionHistory(this.businessId, this.userId, limit);
    } catch (error) {
      Logger.log('error', 'Failed to get user session history', error);
      this.onError?.('Failed to retrieve user session history', error);
      throw error;
    }
  }

  // Get session by ID (updated to use direct API)
  async getSessionById(sessionId) {
    try {
      const endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/${sessionId}`;
      const session = await aiApiRequest(endpoint);
      
      Logger.log('info', 'Session retrieved by ID', { sessionId });
      return session;
    } catch (error) {
      Logger.log('error', 'Failed to get session by ID', error);
      this.onError?.('Failed to retrieve session', error);
      throw error;
    }
  }

  // Load specific session (updated to use direct API)
  async loadSession(sessionId) {
    try {
      const sessionData = await this.getSessionById(sessionId);
      
      if (sessionData) {
        this.currentSessionId = sessionId;
        
        // Load message history for the session
        await this.loadMessageHistory(sessionId);
        
        // Send session loaded event via SocketFacade
        this.socketFacade.sendAIAssistantSessionLoaded(this.businessId, this.userId, sessionId, this.locationId);
        
        // Notify session change
        this.onSessionChange?.(sessionId);
      }
      
      return sessionData;
    } catch (error) {
      Logger.log('error', 'Failed to load session', error);
      this.onError?.('Failed to load session', error);
      throw error;
    }
  }

  // Close current session (updated to use direct API)
  async closeSession(status = 'resolved') {
    if (!this.currentSessionId) {
      Logger.log('warn', 'No active session to close');
      return;
    }

    try {
      // Note: This would need to be implemented based on your backend API
      // For now, we'll just clear the current session
      const sessionId = this.currentSessionId;
      
      Logger.log('info', 'Session closed', { 
        sessionId, 
        status 
      });

      // Send session closed event via SocketFacade
      this.socketFacade.sendAIAssistantSessionClosed(sessionId, status);

      // Clear current session
      this.currentSessionId = null;
      this.messageHistory = [];
      this.onSessionChange?.(null);
      
      return { sessionId, status };
    } catch (error) {
      Logger.log('error', 'Failed to close session', error);
      this.onError?.('Failed to close session', error);
      throw error;
    }
  }

  // Get session statistics (updated to use direct API)
  async getSessionStats() {
    try {
      // Note: This would need to be implemented based on your backend API
      // For now, we'll return basic stats based on session history
      const sessionHistory = await this.loadSessionHistory(100);
      
      const stats = {
        totalSessions: sessionHistory.length,
        activeSessions: sessionHistory.filter(s => s.status === 'active').length,
        resolvedSessions: sessionHistory.filter(s => s.status === 'resolved').length,
        businessId: this.businessId,
        lastUpdated: new Date().toISOString()
      };
      
      // Send stats event via SocketFacade
      this.socketFacade.sendAIAssistantStats(this.businessId, stats);
      
      Logger.log('info', 'Session statistics retrieved', stats);
      return stats;
    } catch (error) {
      Logger.log('error', 'Failed to get session statistics', error);
      this.onError?.('Failed to retrieve session statistics', error);
      throw error;
    }
  }

  // Search messages in current session (updated to use direct API)
  async searchMessages(query, limit = 20) {
    if (!this.currentSessionId) {
      throw new Error('No active session');
    }

    try {
      // Note: This would need to be implemented based on your backend API
      // For now, we'll search through local message history
      const messages = this.messageHistory.filter(message => 
        message.content.toLowerCase().includes(query.toLowerCase())
      ).slice(0, limit);
      
      // Send search event via SocketFacade
      this.socketFacade.sendAIAssistantMessageSearch(
        this.currentSessionId, 
        query, 
        limit, 
        messages.length
      );
      
      Logger.log('info', 'Message search completed', { query, results: messages.length });
      return messages;
    } catch (error) {
      Logger.log('error', 'Failed to search messages', error);
      this.onError?.('Failed to search messages', error);
      throw error;
    }
  }



  // Format session date for display (utility method)
  formatSessionDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Update session ID when received from WebSocket (utility method)
  updateSessionId(newSessionId) {
    if (!newSessionId) {
      Logger.log('warn', '⚠️ Attempted to update session ID with null/undefined value');
      return;
    }

    // Check if this is a real session ID replacing a temp one
    const isTempSession = this.currentSessionId && this.currentSessionId.startsWith('temp_');
    const isRealSession = !newSessionId.startsWith('temp_');
    
    if (newSessionId !== this.currentSessionId) {
      Logger.log('info', '🔄 Session ID updated from WebSocket', { 
        oldSessionId: this.currentSessionId, 
        newSessionId,
        wasTemp: isTempSession,
        isReal: isRealSession
      });
      
      this.currentSessionId = newSessionId;
      this.onSessionChange?.(newSessionId);
      
      // Send session loaded event if this is a new real session
      if (isTempSession && isRealSession) {
        this.socketFacade.sendAIAssistantSessionLoaded(
          this.businessId, 
          this.userId, 
          newSessionId, 
          this.locationId
        );
        Logger.log('info', '✅ Session loaded event sent for new real session');
      }
    }
  }

  // Get current session info (utility method)
  getCurrentSessionInfo() {
    const isTemp = this.currentSessionId && this.currentSessionId.startsWith('temp_');
    
    return {
      sessionId: this.currentSessionId,
      businessId: this.businessId,
      userId: this.userId,
      locationId: this.locationId,
      messageCount: this.messageHistory.length,
      lastMessage: this.messageHistory[this.messageHistory.length - 1] || null,
      isTemporary: isTemp,
      isReal: !isTemp && !!this.currentSessionId
    };
  }

  // Check if session is active (utility method)
  hasActiveSession() {
    return !!this.currentSessionId && !this.currentSessionId.startsWith('temp_');
  }

  // Check if session is temporary (waiting for real session ID)
  hasTemporarySession() {
    return !!this.currentSessionId && this.currentSessionId.startsWith('temp_');
  }

  // Get message by ID (utility method)
  getMessageById(messageId) {
    return this.messageHistory.find(msg => msg.messageId === messageId);
  }

  // Handle streaming message update (utility method for UI)
  handleStreamingMessage(message) {
    const existingIndex = this.messageHistory.findIndex(m => m.messageId === message.messageId);
    
    if (existingIndex >= 0) {
      // Update existing message
      this.messageHistory[existingIndex] = { ...message };
      Logger.log('debug', '🔄 Updated streaming message in history', {
        messageId: message.messageId,
        isStreaming: message.isStreaming
      });
    } else {
      // Add new streaming message
      this.messageHistory.push({ ...message });
      Logger.log('debug', '➕ Added new streaming message to history', {
        messageId: message.messageId
      });
    }
  }

  // Cleanup and dispose
  dispose() {
    Logger.log('info', 'AI Assistant Service disposed');
    
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Clear callbacks
    this.onMessageReceived = null;
    this.onConnectionChange = null;
    this.onSessionChange = null;
    this.onError = null;
    
    // Clear data
    this.messageHistory = [];
    this.currentSessionId = null;
    this.isConnected = false;
  }
}

// Factory function to create AI Assistant Service
export const createAIAssistantService = (businessId, userId, locationId = null) => {
  return new AIAssistantService(businessId, userId, locationId);
};

// Utility functions
export const formatSessionId = (businessId, userId, timestamp) => {
  return `${businessId}:${userId}:${timestamp}`;
};

export const parseSessionId = (sessionId) => {
  const parts = sessionId.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid session ID format');
  }
  
  return {
    businessId: parts[0],
    userId: parts[1],
    timestamp: parseInt(parts[2])
  };
};

export const isValidSessionId = (sessionId) => {
  try {
    parseSessionId(sessionId);
    return true;
  } catch {
    return false;
  }
};
