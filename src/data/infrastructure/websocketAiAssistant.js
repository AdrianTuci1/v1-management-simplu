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
    this.onFunctionCall = null;
    
    // Streaming state
    this.currentStreamingMessage = null;
    this.streamingMessageId = null;
    
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
      this.isConnected = false;
      this.onConnectionChange?.(false);
      this.onError?.('WebSocket indisponibil. Verificați conexiunea la server.', error);
      // Nu mai programăm reconectare automată
      // this.scheduleReconnect();
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
        this.onError?.('WebSocket indisponibil. Verificați conexiunea la server.', data.data);
        break;
        
      case 'timeout':
        this.isConnected = false;
        this.onConnectionChange?.(false);
        this.onError?.('WebSocket indisponibil. Verificați conexiunea la server.');
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
        
      case 'ai_function_call':
        this.handleFunctionCall(payload);
        break;
        
      default:
        Logger.log('warn', 'Unknown message type from worker:', type, payload);
    }
  }

  /**
   * Gestionează AI function calls
   */
  async handleFunctionCall(payload) {
    Logger.log('info', '🔧 Received AI function call', payload);
    
    try {
      // Notifică callback-ul dacă există
      if (this.onFunctionCall) {
        // Callback-ul va executa funcția și va returna răspunsul
        await this.onFunctionCall(payload);
      } else {
        Logger.log('warn', '⚠️ No onFunctionCall callback set - function call ignored');
      }
    } catch (error) {
      Logger.log('error', '❌ Error handling function call', error);
    }
  }

  /**
   * Trimite răspunsul unui function call înapoi către AI
   */
  sendFunctionResponse(callId, functionName, success, result = null, error = null) {
    if (this.isDemoMode) {
      Logger.log('info', 'Demo mode: Function response simulated');
      return true;
    }

    if (!this.isConnected || !this.worker) {
      Logger.log('error', 'Cannot send function response - WebSocket not connected');
      return false;
    }

    try {
      const response = {
        callId,
        functionName,
        success,
        result,
        error,
        timestamp: new Date().toISOString()
      };

      this.worker.postMessage({
        type: 'send',
        data: {
          event: 'function_response',
          payload: response
        }
      });

      Logger.log('info', '✅ Function response sent to AI', { callId, functionName, success });
      
      return true;
    } catch (error) {
      Logger.log('error', '❌ Failed to send function response', error);
      return false;
    }
  }

  /**
   * Gestionează mesajele noi de la WebSocket (cu suport pentru streaming)
   */
  handleNewMessage(payload) {
    const { 
      responseId, 
      message: content, 
      timestamp, 
      sessionId,
      streaming,
      actions,
      toolsUsed 
    } = payload;
    
    Logger.log('info', '📨 WebSocketAIAssistant received new_message', {
      hasContent: !!content,
      hasStreaming: !!streaming,
      streamingType: streaming?.type,
      isChunk: streaming?.isChunk,
      isComplete: streaming?.isComplete,
      sessionId: sessionId
    });
    
    if (!content) {
      Logger.log('warn', 'WebSocketAIAssistant no content in new message', payload);
      return;
    }
    
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
    
    // Handle streaming messages
    if (streaming && streaming.isChunk) {
      // Este un chunk de streaming
      Logger.log('info', '🔄 Processing streaming chunk');
      
      if (!this.currentStreamingMessage) {
        // Creează un nou mesaj streaming
        this.streamingMessageId = responseId || `ai_stream_${Date.now()}`;
        this.currentStreamingMessage = {
          messageId: this.streamingMessageId,
          sessionId: messageSessionId || currentSessionId,
          businessId: this.businessId,
          userId: 'agent',
          content: content,
          type: 'agent',
          timestamp: timestamp || new Date().toISOString(),
          isStreaming: true,
          metadata: { 
            source: 'websocket', 
            responseId,
            streaming: true
          }
        };
        
        Logger.log('info', '✨ Created new streaming message', {
          messageId: this.streamingMessageId,
          initialContentLength: content.length
        });
      } else {
        // Adaugă chunk-ul la mesajul existent
        this.currentStreamingMessage.content += content;
        
        Logger.log('info', '➕ Added chunk to streaming message', {
          messageId: this.streamingMessageId,
          chunkLength: content.length,
          totalLength: this.currentStreamingMessage.content.length
        });
      }
      
      // Notifică callback-ul cu mesajul streaming în curs
      if (this.onMessageReceived) {
        try {
          this.onMessageReceived([{ ...this.currentStreamingMessage }]);
          Logger.log('info', '🎯 Streaming chunk sent to callback');
        } catch (error) {
          Logger.log('error', '❌ Error in streaming chunk callback', error);
        }
      }
      
    } else if (streaming && streaming.isComplete) {
      // Mesaj streaming complet
      Logger.log('info', '✅ Streaming complete');
      
      if (this.currentStreamingMessage) {
        // Finalizează mesajul streaming
        this.currentStreamingMessage.isStreaming = false;
        this.currentStreamingMessage.actions = actions;
        this.currentStreamingMessage.metadata.toolsUsed = toolsUsed;
        this.currentStreamingMessage.metadata.streaming = false;
        
        Logger.log('info', '🏁 Finalized streaming message', {
          messageId: this.streamingMessageId,
          totalLength: this.currentStreamingMessage.content.length,
          hasActions: !!actions,
          actionsCount: actions?.length || 0
        });
        
        // Notifică callback-ul cu mesajul final
        if (this.onMessageReceived) {
          try {
            this.onMessageReceived([{ ...this.currentStreamingMessage }]);
            Logger.log('info', '🎯 Final streaming message sent to callback');
          } catch (error) {
            Logger.log('error', '❌ Error in final streaming callback', error);
          }
        }
        
        // Curăță starea streaming
        this.currentStreamingMessage = null;
        this.streamingMessageId = null;
      } else {
        // Mesaj complet fără chunks anterioare (mesaj direct)
        Logger.log('info', '📝 Complete message without chunks');
        
        const aiMessage = {
          messageId: responseId || `ai_${Date.now()}`,
          sessionId: messageSessionId || currentSessionId,
          businessId: this.businessId,
          userId: 'agent',
          content: content,
          type: 'agent',
          timestamp: timestamp || new Date().toISOString(),
          isStreaming: false,
          actions: actions,
          metadata: { 
            source: 'websocket', 
            responseId,
            toolsUsed,
            streaming: false,
            sessionUpdate: shouldUpdateSession || shouldSetSession
          }
        };
        
        if (this.onMessageReceived) {
          try {
            this.onMessageReceived([aiMessage]);
            Logger.log('info', '🎯 Complete message sent to callback');
          } catch (error) {
            Logger.log('error', '❌ Error in complete message callback', error);
          }
        }
      }
      
    } else {
      // Mesaj normal (fără streaming)
      Logger.log('info', '📝 Normal message (no streaming)');
      
      const aiMessage = {
        messageId: responseId || `ai_${Date.now()}`,
        sessionId: messageSessionId || currentSessionId,
        businessId: this.businessId,
        userId: 'agent',
        content: content,
        type: 'agent',
        timestamp: timestamp || new Date().toISOString(),
        isStreaming: false,
        actions: actions,
        metadata: { 
          source: 'websocket', 
          responseId,
          toolsUsed,
          streaming: false,
          sessionUpdate: shouldUpdateSession || shouldSetSession
        }
      };
      
      if (this.onMessageReceived) {
        try {
          this.onMessageReceived([aiMessage]);
          Logger.log('info', '🎯 Normal message sent to callback');
        } catch (error) {
          Logger.log('error', '❌ Error in normal message callback', error);
        }
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
    
    // Nu mai programăm reconectare automată - doar notificăm utilizatorul
    Logger.log('warn', 'WebSocket disconnected - no automatic reconnection');
    this.onError?.('WebSocket indisponibil. Verificați conexiunea la server.');
  }

  /**
   * Programează reconectarea (DISABLED - nu mai reconectăm automat)
   */
  scheduleReconnect() {
    Logger.log('info', 'Automatic reconnection is disabled. Please reconnect manually if needed.');
    // Reconectarea automată este dezactivată
    // Utilizatorul va fi notificat prin onError callback
    return;
  }

  /**
   * Reconectare manuală (apelată de utilizator)
   */
  manualReconnect() {
    Logger.log('info', 'Manual reconnection requested');
    this.reconnectAttempts = 0; // Reset attempts for manual reconnection
    return this.connect();
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
    
    // Clear streaming state
    this.currentStreamingMessage = null;
    this.streamingMessageId = null;
    
    // Clear callbacks
    this.onMessageReceived = null;
    this.onConnectionChange = null;
    this.onError = null;
    this.onSessionUpdate = null;
    this.onFunctionCall = null;
  }
}

// Export singleton instance factory
export const createWebSocketAIAssistant = (businessId, userId, locationId = null) => {
  return new WebSocketAIAssistant(businessId, userId, locationId);
};

// Export class for custom instances
export default WebSocketAIAssistant;