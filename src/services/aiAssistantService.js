import { getConfig } from '../config/aiAssistantConfig';
import { aiApiRequest } from '../data/infrastructure/apiClient.js';

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
    
    Logger.log('info', 'AI Assistant Service initialized', { businessId, userId, locationId });
  }

  // Generate session ID for daily sessions
  generateSessionId() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return `${this.businessId}:${this.userId}:${startOfDay.getTime()}`;
  }

  // Load today's session
  async loadTodaySession() {
    try {
      const sessionId = this.generateSessionId();
      this.currentSessionId = sessionId;
      
      Logger.log('info', 'Loading today session', { sessionId });
      
      // Load message history
      await this.loadMessageHistory(sessionId);
      
      // Notify session change
      this.onSessionChange?.(sessionId);
      
      return sessionId;
    } catch (error) {
      Logger.log('error', 'Failed to load today session', error);
      this.onError?.(getConfig('ERRORS.SESSION_LOAD_FAILED'), error);
      throw error;
    }
  }

  // Load message history for a session
  async loadMessageHistory(sessionId, limit = null, before = null) {
    try {
      // In demo mode, return mock message history
      if (this.isDemoMode) {
        this.messageHistory = [
          {
            messageId: 'demo-msg-1',
            sessionId: sessionId,
            content: 'Bună! Sunt AI Assistant-ul în modul demo. Cum vă pot ajuta astăzi?',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            type: 'assistant'
          }
        ];
        
        // Notify about loaded messages
        this.onMessageReceived?.(this.messageHistory);
        return;
      }

      let endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/${sessionId}/messages`;
      
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);
      if (before) params.append('before', before);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      const data = await aiApiRequest(endpoint);
      this.messageHistory = data.messages || [];
      
      Logger.log('info', 'Message history loaded', { 
        sessionId, 
        messageCount: this.messageHistory.length 
      });
      
      // Notify about loaded messages
      this.onMessageReceived?.(this.messageHistory);
      
      return this.messageHistory;
    } catch (error) {
      Logger.log('error', 'Failed to load message history', error);
      this.onError?.(getConfig('ERRORS.SESSION_LOAD_FAILED'), error);
      throw error;
    }
  }

  // Send message to AI
  async sendMessage(content, context = {}) {
    if (!this.currentSessionId) {
      throw new Error('No active session');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    if (content.length > getConfig('MESSAGE.MAX_LENGTH')) {
      throw new Error(`Message too long. Maximum ${getConfig('MESSAGE.MAX_LENGTH')} characters allowed.`);
    }

    try {
      // In demo mode, return mock response
      if (this.isDemoMode) {
        const mockResponse = {
          message: "Aceasta este o răspuns demo de la AI Assistant. În modul demo, toate funcționalitățile AI sunt simulate.",
          timestamp: new Date().toISOString(),
          sessionId: this.currentSessionId
        };
        
        // Simulate async response
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              status: 'success',
              data: mockResponse
            });
          }, 1000);
        });
      }

      const messageData = {
        businessId: this.businessId,
        locationId: this.locationId,
        userId: this.userId,
        message: content.trim(),
        sessionId: this.currentSessionId,
        timestamp: new Date().toISOString(),
        context: context
      };

      Logger.log('debug', 'Sending message', messageData);

      const result = await aiApiRequest(getConfig('API_ENDPOINTS.MESSAGES'), {
        method: 'POST',
        body: JSON.stringify(messageData),
      });
      
      if (result.status === 'success') {
        Logger.log('info', 'Message sent successfully', result);
        
        // Add user message to history
        const userMessage = {
          messageId: result.messageId || result.message?.messageId || `user_${Date.now()}`,
          sessionId: this.currentSessionId,
          businessId: this.businessId,
          userId: this.userId,
          content: content.trim(),
          type: 'user',
          timestamp: new Date().toISOString(),
          metadata: { source: 'api' }
        };
        
        this.messageHistory.push(userMessage);
        this.onMessageReceived?.([userMessage]);
        
        return result;
      } else {
        throw new Error(result.message || 'Unknown error occurred');
      }
    } catch (error) {
      Logger.log('error', 'Failed to send message', error);
      this.onError?.(getConfig('ERRORS.MESSAGE_SEND_FAILED'), error);
      throw error;
    }
  }

  // Get active sessions for business
  async getActiveSessions() {
    // In demo mode, return mock data
    if (this.isDemoMode) {
      return {
        activeSessions: [
          {
            sessionId: 'demo-session-1',
            businessId: this.businessId,
            userId: this.userId,
            startTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            status: 'active'
          }
        ]
      };
    }

    try {
      const endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/business/${this.businessId}/active`;
      const data = await aiApiRequest(endpoint);
      Logger.log('info', 'Active sessions retrieved', { 
        businessId: this.businessId, 
        sessionCount: data.activeSessions?.length || 0 
      });
      
      return data.activeSessions || [];
    } catch (error) {
      Logger.log('error', 'Failed to get active sessions', error);
      this.onError?.('Failed to retrieve active sessions', error);
      throw error;
    }
  }

  // Close current session
  async closeSession(status = 'resolved') {
    if (!this.currentSessionId) {
      Logger.log('warn', 'No active session to close');
      return;
    }

    try {
      const url = `${getConfig('API_ENDPOINTS.SESSIONS')}/${this.currentSessionId}`;
      const result = await aiApiRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      // aiApiRequest already handles errors

      Logger.log('info', 'Session closed', { 
        sessionId: this.currentSessionId, 
        status 
      });

      // Clear current session
      this.currentSessionId = null;
      this.onSessionChange?.(null);
      
      return true;
    } catch (error) {
      Logger.log('error', 'Failed to close session', error);
      this.onError?.('Failed to close session', error);
      throw error;
    }
  }

  // Get session statistics
  async getSessionStats() {
    // In demo mode, return mock data
    if (this.isDemoMode) {
      return {
        totalSessions: 15,
        activeSessions: 1,
        messagesToday: 42,
        averageResponseTime: 1.2
      };
    }

    try {
      const endpoint = `${getConfig('API_ENDPOINTS.SESSIONS')}/business/${this.businessId}/stats`;
      const data = await aiApiRequest(endpoint);
      Logger.log('info', 'Session statistics retrieved', data);
      
      return data;
    } catch (error) {
      Logger.log('error', 'Failed to get session statistics', error);
      this.onError?.('Failed to retrieve session statistics', error);
      throw error;
    }
  }

  // Search messages in current session
  async searchMessages(query, limit = 20) {
    if (!this.currentSessionId) {
      throw new Error('No active session');
    }

    // In demo mode, return mock data
    if (this.isDemoMode) {
      console.log('Demo mode: Mock message search');
      return {
        messages: [
          {
            messageId: 'demo-msg-1',
            content: 'Exemplu de mesaj găsit în căutare',
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
          }
        ],
        totalFound: 1
      };
    }

    try {
      const url = new URL(`${getConfig('API_ENDPOINTS.SESSIONS')}/${this.currentSessionId}/search`);
      url.searchParams.append('q', query);
      url.searchParams.append('limit', limit);
      
      const data = await aiApiRequest(url.toString());
      Logger.log('info', 'Message search completed', { 
        query, 
        resultCount: data.messages?.length || 0 
      });
      
      return data.messages || [];
    } catch (error) {
      Logger.log('error', 'Failed to search messages', error);
      this.onError?.('Failed to search messages', error);
      throw error;
    }
  }

  // Export session data
  async exportSession(format = 'json') {
    if (!this.currentSessionId) {
      throw new Error('No active session');
    }

    try {
      const url = new URL(`${getConfig('API_ENDPOINTS.SESSIONS')}/${this.currentSessionId}/export`);
      url.searchParams.append('format', format);
      
      const data = await aiApiRequest(url.toString());
      
      if (format === 'json') {
        return data;
      } else {
        // For non-JSON formats, return the data as is
        return data;
      }
    } catch (error) {
      Logger.log('error', 'Failed to export session', error);
      this.onError?.('Failed to export session', error);
      throw error;
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
