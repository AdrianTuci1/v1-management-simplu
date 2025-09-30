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
    this.onReconnect = null;
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
        
      case 'ai_response':
        this.handleAIResponse(payload);
        break;
        
      case 'session_update':
        Logger.log('info', 'WebSocketAIAssistant handling session_update type');
        this.handleSessionUpdate(payload);
        break;
        
      case 'message_sent':
        Logger.log('debug', 'Message sent successfully', payload);
        break;
        
      // Handle new AI Assistant DataFacade events
      case 'ai_assistant_connected':
        this.handleAIAssistantConnected(payload);
        break;
        
      case 'ai_assistant_disconnected':
        this.handleAIAssistantDisconnected(payload);
        break;
        
      case 'ai_assistant_session_loaded':
        this.handleAIAssistantSessionLoaded(payload);
        break;
        
      case 'ai_assistant_session_closed':
        this.handleAIAssistantSessionClosed(payload);
        break;
        
      case 'ai_assistant_messages_searched':
        this.handleAIAssistantMessagesSearched(payload);
        break;
        
      case 'ai_assistant_session_exported':
        this.handleAIAssistantSessionExported(payload);
        break;
        
      case 'ai_assistant_stats_retrieved':
        this.handleAIAssistantStatsRetrieved(payload);
        break;
        
      // Handle AI Agent resource and draft events
      case 'agent_resource_query_result':
        this.handleAgentResourceQueryResult(payload);
        break;
        
      case 'agent_resource_query_error':
        this.handleAgentResourceQueryError(payload);
        break;
        
      case 'agent_draft_created':
        this.handleAgentDraftCreated(payload);
        break;
        
      case 'agent_draft_updated':
        this.handleAgentDraftUpdated(payload);
        break;
        
      case 'agent_draft_committed':
        this.handleAgentDraftCommitted(payload);
        break;
        
      case 'agent_draft_cancelled':
        this.handleAgentDraftCancelled(payload);
        break;
        
      case 'agent_drafts_listed':
        this.handleAgentDraftsListed(payload);
        break;
        
      case 'agent_request_error':
        this.handleAgentRequestError(payload);
        break;
        
      default:
        Logger.log('warn', 'Unknown message type from worker:', type, payload);
    }
  }

  /**
   * Gestionează mesajele noi de la WebSocket
   */
  handleNewMessage(payload) {
    const messageData = payload.payload || payload;
    const { message: content, responseId, timestamp, sessionId } = messageData;
    
    if (content) {
      const aiMessage = {
        messageId: responseId || `ai_${Date.now()}`,
        sessionId: sessionId,
        businessId: this.businessId,
        userId: 'agent',
        content: content,
        type: 'agent',
        timestamp: timestamp || new Date().toISOString(),
        metadata: { source: 'websocket', responseId }
      };
      
      Logger.log('info', '🎯 WebSocketAIAssistant calling onMessageReceived (new_message)', {
        sessionId: aiMessage.sessionId,
        messageId: aiMessage.messageId,
        hasCallback: !!this.onMessageReceived,
        callbackType: typeof this.onMessageReceived
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
   * Gestionează răspunsurile AI de la WebSocket
   */
  handleAIResponse(payload) {
    // Extract data from the actual payload structure
    const { content, message_id, session_id, timestamp, context, type } = payload;
    
    if (content) {
      const aiMessage = {
        messageId: message_id || `ai_${Date.now()}`,
        sessionId: session_id,
        businessId: this.businessId,
        userId: 'agent',
        content: content,
        type: 'agent',
        timestamp: timestamp || new Date().toISOString(),
        metadata: { 
          source: 'websocket', 
          responseId: message_id,
          context: context,
          originalType: type
        }
      };
      
      Logger.log('info', '🎯 WebSocketAIAssistant calling onMessageReceived (ai_response)', {
        sessionId: aiMessage.sessionId,
        messageId: aiMessage.messageId,
        hasCallback: !!this.onMessageReceived,
        callbackType: typeof this.onMessageReceived
      });
      
      if (this.onMessageReceived) {
        Logger.log('info', '🎯 WebSocketAIAssistant executing callback (ai_response)');
        try {
          this.onMessageReceived([aiMessage]);
          Logger.log('info', '🎯 WebSocketAIAssistant callback executed successfully (ai_response)');
        } catch (error) {
          Logger.log('error', '❌ WebSocketAIAssistant callback error (ai_response)', error);
        }
      } else {
        Logger.log('warn', '❌ WebSocketAIAssistant callback is null/undefined (ai_response)');
      }
    } else {
      Logger.log('warn', 'WebSocketAIAssistant no content found in AI response payload', payload);
    }
  }

  /**
   * Gestionează actualizările sesiunii
   */
  handleSessionUpdate(payload) {
    const { sessionId, status, metadata } = payload;
    Logger.log('info', 'Session update received', { sessionId, status, metadata });
    
    if (this.onSessionUpdate) {
      this.onSessionUpdate(payload);
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

  // ========================================
  // AI ASSISTANT DATAFACADE EVENT HANDLERS
  // ========================================

  /**
   * Gestionează evenimentul de conectare AI Assistant
   */
  handleAIAssistantConnected(payload) {
    Logger.log('info', 'AI Assistant connected via DataFacade', payload);
    this.isConnected = true;
    this.onConnectionChange?.(true);
  }

  /**
   * Gestionează evenimentul de deconectare AI Assistant
   */
  handleAIAssistantDisconnected(payload) {
    Logger.log('info', 'AI Assistant disconnected via DataFacade', payload);
    this.isConnected = false;
    this.onConnectionChange?.(false);
  }

  /**
   * Gestionează evenimentul de încărcare sesiune AI Assistant
   */
  handleAIAssistantSessionLoaded(payload) {
    Logger.log('info', 'AI Assistant session loaded via DataFacade', payload);
    if (payload.sessionId) {
      this.currentSessionId = payload.sessionId;
    }
    this.onSessionUpdate?.(payload);
  }

  /**
   * Gestionează evenimentul de închidere sesiune AI Assistant
   */
  handleAIAssistantSessionClosed(payload) {
    Logger.log('info', 'AI Assistant session closed via DataFacade', payload);
    this.onSessionUpdate?.(payload);
  }

  /**
   * Gestionează evenimentul de căutare mesaje AI Assistant
   */
  handleAIAssistantMessagesSearched(payload) {
    Logger.log('info', 'AI Assistant messages searched via DataFacade', payload);
    // Poate fi folosit pentru a actualiza UI-ul cu rezultatele căutării
    if (this.onMessageReceived) {
      this.onMessageReceived([{
        type: 'search_results',
        data: payload,
        timestamp: new Date().toISOString()
      }]);
    }
  }

  /**
   * Gestionează evenimentul de export sesiune AI Assistant
   */
  handleAIAssistantSessionExported(payload) {
    Logger.log('info', 'AI Assistant session exported via DataFacade', payload);
    // Poate fi folosit pentru a gestiona download-ul fișierului exportat
  }

  /**
   * Gestionează evenimentul de preluare statistici AI Assistant
   */
  handleAIAssistantStatsRetrieved(payload) {
    Logger.log('info', 'AI Assistant stats retrieved via DataFacade', payload);
    // Poate fi folosit pentru a actualiza dashboard-ul cu statisticile
  }

  // ========================================
  // AI AGENT RESOURCE AND DRAFT EVENT HANDLERS
  // ========================================

  /**
   * Gestionează rezultatul interogării de resurse de la agent
   */
  handleAgentResourceQueryResult(payload) {
    Logger.log('info', 'Agent resource query result received', payload);
    // Poate fi folosit pentru a actualiza UI-ul cu rezultatele interogării
    if (this.onMessageReceived) {
      this.onMessageReceived([{
        type: 'agent_resource_query_result',
        data: payload,
        timestamp: new Date().toISOString()
      }]);
    }
  }

  /**
   * Gestionează eroarea interogării de resurse de la agent
   */
  handleAgentResourceQueryError(payload) {
    Logger.log('error', 'Agent resource query error received', payload);
    if (this.onError) {
      this.onError('Agent resource query failed', payload);
    }
  }

  /**
   * Gestionează crearea de draft-uri de la agent
   */
  handleAgentDraftCreated(payload) {
    Logger.log('info', 'Agent draft created', payload);
    // Poate fi folosit pentru a actualiza UI-ul cu draft-ul creat
    if (this.onMessageReceived) {
      this.onMessageReceived([{
        type: 'agent_draft_created',
        data: payload,
        timestamp: new Date().toISOString()
      }]);
    }
  }

  /**
   * Gestionează actualizarea de draft-uri de la agent
   */
  handleAgentDraftUpdated(payload) {
    Logger.log('info', 'Agent draft updated', payload);
    // Poate fi folosit pentru a actualiza UI-ul cu draft-ul actualizat
    if (this.onMessageReceived) {
      this.onMessageReceived([{
        type: 'agent_draft_updated',
        data: payload,
        timestamp: new Date().toISOString()
      }]);
    }
  }

  /**
   * Gestionează confirmarea de draft-uri de la agent
   */
  handleAgentDraftCommitted(payload) {
    Logger.log('info', 'Agent draft committed', payload);
    // Poate fi folosit pentru a actualiza UI-ul cu confirmarea draft-ului
    if (this.onMessageReceived) {
      this.onMessageReceived([{
        type: 'agent_draft_committed',
        data: payload,
        timestamp: new Date().toISOString()
      }]);
    }
  }

  /**
   * Gestionează anularea de draft-uri de la agent
   */
  handleAgentDraftCancelled(payload) {
    Logger.log('info', 'Agent draft cancelled', payload);
    // Poate fi folosit pentru a actualiza UI-ul cu anularea draft-ului
    if (this.onMessageReceived) {
      this.onMessageReceived([{
        type: 'agent_draft_cancelled',
        data: payload,
        timestamp: new Date().toISOString()
      }]);
    }
  }

  /**
   * Gestionează listarea de draft-uri de la agent
   */
  handleAgentDraftsListed(payload) {
    Logger.log('info', 'Agent drafts listed', payload);
    // Poate fi folosit pentru a actualiza UI-ul cu lista de draft-uri
    if (this.onMessageReceived) {
      this.onMessageReceived([{
        type: 'agent_drafts_listed',
        data: payload,
        timestamp: new Date().toISOString()
      }]);
    }
  }

  /**
   * Gestionează erorile de la agent
   */
  handleAgentRequestError(payload) {
    Logger.log('error', 'Agent request error received', payload);
    if (this.onError) {
      this.onError('Agent request failed', payload);
    }
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
    this.onReconnect = null;
    this.onSessionUpdate = null;
  }
}

// Export singleton instance factory
export const createWebSocketAIAssistant = (businessId, userId, locationId = null) => {
  return new WebSocketAIAssistant(businessId, userId, locationId);
};

// Export class for custom instances
export default WebSocketAIAssistant;
