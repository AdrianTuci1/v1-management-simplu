/**
 * WebSocket AI Assistant Infrastructure
 * 
 * Acest modul gestionează comunicarea WebSocket pentru AI Assistant:
 * - Conectarea la WebSocket server pentru AI
 * - Gestionarea sesiunilor AI
 * - Trimiterea și primirea mesajelor
 * - Gestionarea reconectării și heartbeat
 */

import { getConfig } from '../../config/aiAssistantConfig.js';

// Logger utility
class Logger {
  static log(level, message, data = null) {
    if (!getConfig('LOGGING.ENABLED')) return;
    
    const logLevel = getConfig('LOGGING.LEVEL');
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    
    if (levels[level] >= levels[logLevel]) {
      const timestamp = new Date().toISOString();
      const logMessage = `[WebSocket AI Assistant ${level.toUpperCase()}] ${timestamp}: ${message}`;
      
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

export class WebSocketAIAssistant {
  constructor(businessId, userId, locationId = null) {
    this.businessId = businessId;
    this.userId = userId;
    this.locationId = locationId || getConfig('DEFAULTS.LOCATION_ID');
    this.currentSessionId = null;
    
    // WebSocket worker state
    this.worker = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = getConfig('WEBSOCKET.MAX_RECONNECT_ATTEMPTS');
    this.reconnectDelay = getConfig('WEBSOCKET.RECONNECT_DELAY');
    this.heartbeatInterval = null;
    this.heartbeatIntervalMs = getConfig('WEBSOCKET.HEARTBEAT_INTERVAL');
    this.lastCloseCode = null;
    this.isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    
    // Event callbacks
    this.onMessageReceived = null;
    this.onConnectionChange = null;
    this.onError = null;
    this.onSessionUpdate = null;
    
    Logger.log('info', 'WebSocket AI Assistant initialized', { businessId, userId, locationId });
  }

  // ========================================
  // CONNECTION MANAGEMENT
  // ========================================

  /**
   * Conectează la WebSocket server pentru AI Assistant
   */
  async connect() {
    if (this.isDemoMode) {
      Logger.log('info', 'Demo mode: WebSocket connection skipped');
      this.isConnected = true;
      this.onConnectionChange?.(true);
      return;
    }

    try {
      Logger.log('info', 'Connecting to AI WebSocket server...');
      await this.connectWithWorker();
    } catch (error) {
      Logger.log('error', 'Failed to connect to AI WebSocket server', error);
      this.onError?.(getConfig('ERRORS.CONNECTION_FAILED'), error);
      this.scheduleReconnect();
    }
  }

  /**
   * Conectează folosind WebSocket Worker
   */
  async connectWithWorker() {
    try {
      // Create worker
      this.worker = new Worker('/ai-websocket-worker.js');
      
      // Set up worker event handlers
      this.worker.onmessage = (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'ready':
            Logger.log('info', 'AI WebSocket Worker ready');
            break;
            
          case 'status':
            this.handleWorkerStatus(data);
            break;
            
          case 'message':
            this.handleWorkerMessage(data);
            break;
            
          case 'log':
            const logLevel = data.kind === 'error' ? 'error' : data.kind === 'warn' ? 'warn' : 'log';
            Logger.log(logLevel, `[AI WebSocket Worker] ${data.msg}`, data);
            break;
            
          default:
            Logger.log('warn', 'Unknown message type from worker:', type, data);
        }
      };
      
      this.worker.onerror = (error) => {
        Logger.log('error', 'AI WebSocket Worker error:', error);
        this.onError?.('Worker error', error);
      };
      
      // Connect to WebSocket server
      const channelName = `messages:${this.businessId}`;
      
      this.worker.postMessage({
        type: 'connect',
        data: {
          url: getConfig('API_ENDPOINTS.WEBSOCKET'),
          channelName
        }
      });
      
    } catch (error) {
      Logger.log('error', 'Failed to connect with AI WebSocket Worker', error);
      throw error;
    }
  }

  /**
   * Deconectează de la WebSocket
   */
  disconnect() {
    Logger.log('info', 'Disconnecting from AI WebSocket server...');
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Disconnect worker
    if (this.worker) {
      this.worker.postMessage({ type: 'disconnect' });
      this.worker.terminate();
      this.worker = null;
    }
    
    this.isConnected = false;
    this.onConnectionChange?.(false);
    
    Logger.log('info', 'AI WebSocket disconnected');
  }

  // ========================================
  // MESSAGE HANDLING
  // ========================================

  /**
   * Gestionează statusul worker-ului
   */
  handleWorkerStatus(data) {
    const { status } = data;
    
    switch (status) {
      case 'connecting':
        this.isConnected = false;
        this.onConnectionChange?.(false);
        break;
        
      case 'connected':
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(true);
        this.startHeartbeat();
        break;
        
      case 'disconnected':
        this.isConnected = false;
        this.onConnectionChange?.(false);
        this.handleDisconnection();
        break;
        
      case 'error':
        this.isConnected = false;
        this.onConnectionChange?.(false);
        this.onError?.('WebSocket connection error', data.data);
        break;
        
      case 'timeout':
        this.isConnected = false;
        this.onConnectionChange?.(false);
        this.onError?.('WebSocket connection timeout');
        break;
    }
  }

  /**
   * Gestionează mesajele de la worker
   */
  handleWorkerMessage(data) {
    const { type, data: payload } = data;
    
    switch (type) {
      case 'new_message':
        this.handleNewMessage(payload);
        break;
        
      case 'frontend_data_available':
        this.handleFrontendDataAvailable(payload);
        break;
        
      case 'draft_created':
        this.handleDraftCreated(payload);
        break;
        
      case 'draft_updated':
        this.handleDraftUpdated(payload);
        break;
        
      case 'draft_deleted':
        this.handleDraftDeleted(payload);
        break;
        
      case 'drafts_listed':
        this.handleDraftsListed(payload);
        break;
        
      default:
        Logger.log('warn', 'Unknown message type from worker:', type, payload);
    }
  }

  /**
   * Gestionează mesajele noi de la WebSocket
   */
  handleNewMessage(payload) {
    const { responseId, message: content, timestamp, sessionId } = payload;
    
    if (content) {
      // Check if this message is for the current session or if we need to update session ID
      const messageSessionId = sessionId;
      const currentSessionId = this.currentSessionId;
      
      // If we have a temp session ID but got a real one, update it
      const isTempSession = currentSessionId && currentSessionId.startsWith('temp_');
      const shouldUpdateSession = isTempSession && messageSessionId && !messageSessionId.startsWith('temp_');
      
      // If we don't have a current session but got one, update it
      const shouldSetSession = !currentSessionId && messageSessionId;
      
      // Update session ID if needed
      if (shouldUpdateSession || shouldSetSession) {
        Logger.log('info', '🔄 Updating session ID from WebSocket message', { 
          oldSessionId: currentSessionId, 
          newSessionId: messageSessionId,
          reason: shouldUpdateSession ? 'temp_to_real' : 'null_to_real'
        });
        this.currentSessionId = messageSessionId;
        
        // Notify about session update
        if (this.onSessionUpdate) {
          this.onSessionUpdate({
            sessionId: messageSessionId,
            status: 'updated',
            metadata: { source: 'websocket_message', reason: shouldUpdateSession ? 'temp_to_real' : 'null_to_real' }
          });
        }
      }
      
      const aiMessage = {
        messageId: responseId || `ai_${Date.now()}`,
        sessionId: messageSessionId || currentSessionId,
        businessId: this.businessId,
        userId: 'agent',
        content: content,
        type: 'agent',
        timestamp: timestamp || new Date().toISOString(),
        metadata: { 
          source: 'websocket', 
          responseId,
          sessionUpdate: shouldUpdateSession || shouldSetSession
        }
      };
      
      Logger.log('info', '🎯 WebSocketAIAssistant calling onMessageReceived (new_message)', {
        sessionId: aiMessage.sessionId,
        messageId: aiMessage.messageId,
        hasCallback: !!this.onMessageReceived,
        callbackType: typeof this.onMessageReceived,
        sessionUpdated: shouldUpdateSession || shouldSetSession
      });
      
      if (this.onMessageReceived) {
        Logger.log('info', '🎯 WebSocketAIAssistant executing callback');
        try {
          this.onMessageReceived([aiMessage]);
          Logger.log('info', '🎯 WebSocketAIAssistant callback executed successfully');
        } catch (error) {
          Logger.log('error', '❌ WebSocketAIAssistant callback error', error);
        }
      } else {
        Logger.log('warn', '❌ WebSocketAIAssistant callback is null/undefined');
      }
    } else {
      Logger.log('warn', 'WebSocketAIAssistant no content in new message', payload);
    }
  }

  /**
   * Gestionează datele frontend disponibile
   */
  handleFrontendDataAvailable(payload) {
    const { messageId, message, timestamp, sessionId, frontendData } = payload;
    
    Logger.log('info', 'Frontend data available received', payload);
    
    const frontendMessage = {
      messageId: messageId || `frontend_${Date.now()}`,
      sessionId: sessionId || this.currentSessionId,
      businessId: this.businessId,
      userId: 'agent',
      content: message,
      type: 'frontend_data',
      timestamp: timestamp || new Date().toISOString(),
      metadata: { 
        source: 'websocket',
        frontendData: frontendData
      }
    };
    
    if (this.onMessageReceived) {
      try {
        this.onMessageReceived([frontendMessage]);
        Logger.log('info', 'Frontend data message sent to callback');
      } catch (error) {
        Logger.log('error', 'Error processing frontend data message', error);
      }
    }
  }

  /**
   * Gestionează crearea de draft-uri
   */
  handleDraftCreated(payload) {
    Logger.log('info', 'Draft created received', payload);
    
    const draftMessage = {
      messageId: payload.messageId || `draft_created_${Date.now()}`,
      sessionId: payload.sessionId || this.currentSessionId,
      businessId: this.businessId,
      userId: 'agent',
      content: payload.message || 'Draft created',
      type: 'draft_created',
      timestamp: payload.timestamp || new Date().toISOString(),
      metadata: { 
        source: 'websocket',
        draftData: payload.draftData
      }
    };
    
    if (this.onMessageReceived) {
      try {
        this.onMessageReceived([draftMessage]);
        Logger.log('info', 'Draft created message sent to callback');
      } catch (error) {
        Logger.log('error', 'Error processing draft created message', error);
      }
    }
  }

  /**
   * Gestionează actualizarea de draft-uri
   */
  handleDraftUpdated(payload) {
    Logger.log('info', 'Draft updated received', payload);
    
    const draftMessage = {
      messageId: payload.messageId || `draft_updated_${Date.now()}`,
      sessionId: payload.sessionId || this.currentSessionId,
      businessId: this.businessId,
      userId: 'agent',
      content: payload.message || 'Draft updated',
      type: 'draft_updated',
      timestamp: payload.timestamp || new Date().toISOString(),
      metadata: { 
        source: 'websocket',
        draftData: payload.draftData
      }
    };
    
    if (this.onMessageReceived) {
      try {
        this.onMessageReceived([draftMessage]);
        Logger.log('info', 'Draft updated message sent to callback');
      } catch (error) {
        Logger.log('error', 'Error processing draft updated message', error);
      }
    }
  }

  /**
   * Gestionează ștergerea de draft-uri
   */
  handleDraftDeleted(payload) {
    Logger.log('info', 'Draft deleted received', payload);
    
    const draftMessage = {
      messageId: payload.messageId || `draft_deleted_${Date.now()}`,
      sessionId: payload.sessionId || this.currentSessionId,
      businessId: this.businessId,
      userId: 'agent',
      content: payload.message || 'Draft deleted',
      type: 'draft_deleted',
      timestamp: payload.timestamp || new Date().toISOString(),
      metadata: { 
        source: 'websocket',
        draftData: payload.draftData
      }
    };
    
    if (this.onMessageReceived) {
      try {
        this.onMessageReceived([draftMessage]);
        Logger.log('info', 'Draft deleted message sent to callback');
      } catch (error) {
        Logger.log('error', 'Error processing draft deleted message', error);
      }
    }
  }

  /**
   * Gestionează listarea de draft-uri
   */
  handleDraftsListed(payload) {
    Logger.log('info', 'Drafts listed received', payload);
    
    const draftMessage = {
      messageId: payload.messageId || `drafts_listed_${Date.now()}`,
      sessionId: payload.sessionId || this.currentSessionId,
      businessId: this.businessId,
      userId: 'agent',
      content: payload.message || 'Drafts listed',
      type: 'drafts_listed',
      timestamp: payload.timestamp || new Date().toISOString(),
      metadata: { 
        source: 'websocket',
        draftData: payload.draftData
      }
    };
    
    if (this.onMessageReceived) {
      try {
        this.onMessageReceived([draftMessage]);
        Logger.log('info', 'Drafts listed message sent to callback');
      } catch (error) {
        Logger.log('error', 'Error processing drafts listed message', error);
      }
    }
  }

  // ========================================
  // MESSAGE SENDING
  // ========================================

  /**
   * Trimite un mesaj prin WebSocket
   */
  sendMessage(content, context = {}) {
    if (this.isDemoMode) {
      Logger.log('info', 'Demo mode: Message sending simulated');
      return true;
    }

    if (!this.isConnected || !this.worker) {
      throw new Error('WebSocket not connected');
    }

    try {
      const message = {
        businessId: this.businessId,
        locationId: this.locationId,
        userId: this.userId,
        message: content,
        sessionId: this.currentSessionId,
        timestamp: new Date().toISOString(),
        context: context
      };

      this.worker.postMessage({
        type: 'send',
        data: {
          event: 'send_message',
          payload: message
        }
      });

      Logger.log('debug', 'Message sent via WebSocket', message);
      
      return true;
    } catch (error) {
      Logger.log('error', 'Failed to send message via WebSocket', error);
      throw error;
    }
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Setează ID-ul sesiunii curente
   */
  setCurrentSessionId(sessionId) {
    this.currentSessionId = sessionId;
    Logger.log('debug', 'Session ID set for WebSocket AI Assistant', sessionId);
  }

  /**
   * Generează ID-ul sesiunii pentru sesiuni zilnice
   */
  generateSessionId() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return `${this.businessId}:${this.userId}:${startOfDay.getTime()}`;
  }

  // ========================================
  // HEARTBEAT MANAGEMENT
  // ========================================

  /**
   * Pornește heartbeat-ul
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatIntervalMs);

    Logger.log('debug', 'Heartbeat started', { interval: this.heartbeatIntervalMs });
  }

  /**
   * Trimite heartbeat
   */
  sendHeartbeat() {
    if (!this.isConnected || !this.worker || this.isDemoMode) return;

    try {
      this.worker.postMessage({
        type: 'heartbeat'
      });
      
      Logger.log('debug', 'Heartbeat sent');
    } catch (error) {
      Logger.log('error', 'Failed to send heartbeat', error);
    }
  }

  // ========================================
  // RECONNECTION MANAGEMENT
  // ========================================

  /**
   * Gestionează deconectarea
   */
  handleDisconnection() {
    this.isConnected = false;
    this.onConnectionChange?.(false);
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Schedule reconnection if not manually disconnected
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      Logger.log('error', 'Max reconnection attempts reached');
      this.onError?.('Max reconnection attempts reached');
    }
  }

  /**
   * Programează reconectarea
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      Logger.log('warn', 'Max reconnection attempts reached, stopping reconnection');
      return;
    }

    this.reconnectAttempts++;
    let delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    Logger.log('info', `Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    // Don't reconnect immediately for server errors (1011)
    if (this.lastCloseCode === 1011) {
      Logger.log('warn', 'Server error detected, waiting longer before reconnection');
      delay = Math.max(delay, 30000); // Wait at least 30 seconds for server errors
    }
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  // ========================================
  // STATUS AND UTILITIES
  // ========================================

  /**
   * Obține statusul conexiunii
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      hasWorker: !!this.worker,
      currentSessionId: this.currentSessionId,
      isDemoMode: this.isDemoMode
    };
  }

  /**
   * Verifică dacă este conectat
   */
  isConnected() {
    return this.isConnected;
  }

  /**
   * Curățare și dezalocare
   */
  dispose() {
    Logger.log('info', 'WebSocket AI Assistant disposed');
    
    this.disconnect();
    
    // Clear callbacks
    this.onMessageReceived = null;
    this.onConnectionChange = null;
    this.onError = null;
    this.onSessionUpdate = null;
  }
}

// Export singleton instance factory
export const createWebSocketAIAssistant = (businessId, userId, locationId = null) => {
  return new WebSocketAIAssistant(businessId, userId, locationId);
};

// Export class for custom instances
export default WebSocketAIAssistant;