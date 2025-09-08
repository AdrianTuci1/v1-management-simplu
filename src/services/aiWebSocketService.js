import { getConfig } from '../config/aiAssistantConfig';

// Logger utility
class Logger {
  static log(level, message, data = null) {
    if (!getConfig('LOGGING.ENABLED')) return;
    
    const logLevel = getConfig('LOGGING.LEVEL');
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    
    if (levels[level] >= levels[logLevel]) {
      const timestamp = new Date().toISOString();
      const logMessage = `[AI WebSocket ${level.toUpperCase()}] ${timestamp}: ${message}`;
      
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

// AI WebSocket Service Class
export class AIWebSocketService {
  constructor(businessId, userId, locationId = null) {
    this.businessId = businessId;
    this.userId = userId;
    this.locationId = locationId || getConfig('DEFAULTS.LOCATION_ID');
    this.currentSessionId = null; // Add session ID tracking
    
    // WebSocket worker state
    this.worker = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = getConfig('WEBSOCKET.MAX_RECONNECT_ATTEMPTS');
    this.reconnectDelay = getConfig('WEBSOCKET.RECONNECT_DELAY');
    this.heartbeatInterval = null;
    this.heartbeatIntervalMs = getConfig('WEBSOCKET.HEARTBEAT_INTERVAL');
    this.lastCloseCode = null;
    
    // Event callbacks
    this.onMessageReceived = null;
    this.onConnectionChange = null;
    this.onError = null;
    this.onReconnect = null;
    
    Logger.log('info', 'AI WebSocket Service initialized', { businessId, userId, locationId });
  }

  // Connect to WebSocket server
  async connect() {
    try {
      Logger.log('info', 'Connecting to WebSocket server...');
      await this.connectWithWorker();
    } catch (error) {
      Logger.log('error', 'Failed to connect to WebSocket server', error);
      this.onError?.(getConfig('ERRORS.CONNECTION_FAILED'), error);
      this.scheduleReconnect();
    }
  }

  // Connect using WebSocket Worker
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
      Logger.log('error', 'Failed to connect with WebSocket Worker', error);
      throw error;
    }
  }



  // Handle worker status updates
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

  // Handle worker messages
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
        this.handleSessionUpdate(payload);
        break;
        
      case 'message_sent':
        Logger.log('debug', 'Message sent successfully', payload);
        break;
        
      default:
        Logger.log('warn', 'Unknown message type from worker:', type, payload);
    }
  }





  // Handle new message from WebSocket
  handleNewMessage(payload) {
    // Handle both direct payload and payload from event structure
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
      
      this.onMessageReceived?.([aiMessage]);
    }
  }

  // Handle session update from WebSocket
  handleSessionUpdate(payload) {
    const { sessionId, status, metadata } = payload;
    Logger.log('info', 'Session update received', { sessionId, status, metadata });
    
    // Notify about session changes
    if (this.onSessionUpdate) {
      this.onSessionUpdate(payload);
    }
  }

  // Handle AI response from WebSocket
  handleAIResponse(payload) {
    Logger.log('debug', 'Processing AI response payload', payload);
    
    const { content, messageId, sessionId, timestamp } = payload;
    
    if (content) {
      const aiMessage = {
        messageId: messageId || `ai_${Date.now()}`,
        sessionId: sessionId,
        businessId: this.businessId,
        userId: 'agent',
        content: content,
        type: 'agent',
        timestamp: timestamp || new Date().toISOString(),
        metadata: { source: 'websocket' }
      };
      
      Logger.log('debug', 'Created AI response message object', aiMessage);
      
      if (this.onMessageReceived) {
        Logger.log('debug', 'Calling onMessageReceived callback for AI response', [aiMessage]);
        this.onMessageReceived([aiMessage]);
      } else {
        Logger.log('warn', 'onMessageReceived callback not set for AI response');
      }
    } else {
      Logger.log('warn', 'No content found in AI response payload', payload);
    }
  }

  // Handle heartbeat
  handleHeartbeat() {
    Logger.log('debug', 'Heartbeat received');
    // Reset heartbeat timer
    this.resetHeartbeat();
  }

  // Start heartbeat interval
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatIntervalMs);

    Logger.log('debug', 'Heartbeat started', { interval: this.heartbeatIntervalMs });
  }

  // Send heartbeat
  sendHeartbeat() {
    if (!this.isConnected || !this.worker) return;

    try {
      this.worker.postMessage({
        type: 'heartbeat'
      });
      
      Logger.log('debug', 'Heartbeat sent');
    } catch (error) {
      Logger.log('error', 'Failed to send heartbeat', error);
    }
  }

  // Reset heartbeat timer
  resetHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.startHeartbeat();
    }
  }

  // Handle disconnection
  handleDisconnection() {
    this.isConnected = false;
    this.onConnectionChange?.(false);
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Clear channel
    this.messagesChannel = null;
    
    // Schedule reconnection if not manually disconnected
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      Logger.log('error', 'Max reconnection attempts reached');
      this.onError?.('Max reconnection attempts reached');
    }
  }

  // Schedule reconnection
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      Logger.log('warn', 'Max reconnection attempts reached, stopping reconnection');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
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

  // Send message via WebSocket
  sendMessage(content, context = {}) {
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



  // Set current session ID
  setCurrentSessionId(sessionId) {
    this.currentSessionId = sessionId;
    Logger.log('debug', 'Session ID set for WebSocket service', sessionId);
  }

  // Disconnect from WebSocket
  disconnect() {
    Logger.log('info', 'Disconnecting from WebSocket server...');
    
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
    
    Logger.log('info', 'WebSocket disconnected');
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      hasWorker: !!this.worker
    };
  }

  // Cleanup and dispose
  dispose() {
    Logger.log('info', 'AI WebSocket Service disposed');
    
    this.disconnect();
    
    // Clear callbacks
    this.onMessageReceived = null;
    this.onConnectionChange = null;
    this.onError = null;
    this.onReconnect = null;
    this.onSessionUpdate = null;
  }
}

// Factory function to create AI WebSocket Service
export const createAIWebSocketService = (businessId, userId, locationId = null) => {
  return new AIWebSocketService(businessId, userId, locationId);
};

// Utility functions
export const isWebSocketSupported = () => {
  return typeof WebSocket !== 'undefined' || (typeof window !== 'undefined' && window.Phoenix);
};

export const getWebSocketType = () => {
  if (typeof window !== 'undefined' && window.Phoenix) {
    return 'phoenix';
  } else if (typeof WebSocket !== 'undefined') {
    return 'native';
  }
  return 'none';
};
