import { getConfig } from '../config/aiAssistantConfig';
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
    
    // Streaming message state
    this.streamingMessages = new Map(); // Map<messageId, {content, metadata}>
    
    // Event callbacks
    this.onMessageReceived = null;
    this.onConnectionChange = null;
    this.onError = null;
    this.onReconnect = null;
    this.onSessionUpdate = null;
    this.onFunctionCall = null;
    this.onStreamingUpdate = null; // New callback for streaming updates
    
    // DataFacade and SocketFacade integration
    this.dataFacade = dataFacade;
    this.socketFacade = socketFacade;
    this.aiAssistantInstance = null;
    
    Logger.log('info', 'AI WebSocket Service initialized', { businessId, userId, locationId });
  }

  // Connect to WebSocket server
  async connect() {
    try {
      Logger.log('info', 'Connecting to WebSocket server via SocketFacade...');
      
      // Get or create AI Assistant instance from SocketFacade FIRST
      this.aiAssistantInstance = this.socketFacade.createAIAssistant(this.businessId, this.userId, this.locationId);
      
      // Set up event handlers BEFORE connecting
      this.aiAssistantInstance.onMessageReceived = (messages) => {
        Logger.log('info', '🎯 AIWebSocketService received messages from instance', {
          messageCount: messages?.length || 0,
          hasCallback: !!this.onMessageReceived,
          callbackType: typeof this.onMessageReceived
        });
        
        if (this.onMessageReceived) {
          try {
            this.onMessageReceived(messages);
            Logger.log('info', '✅ AIWebSocketService forwarded messages to hook');
          } catch (error) {
            Logger.log('error', '❌ Error in AIWebSocketService onMessageReceived callback', error);
          }
        } else {
          Logger.log('warn', '⚠️ AIWebSocketService onMessageReceived callback not set');
        }
      };
      
      this.aiAssistantInstance.onConnectionChange = (isConnected) => {
        Logger.log('info', '🔌 AI Assistant instance connection changed', { isConnected });
        this.isConnected = isConnected;
        this.onConnectionChange?.(isConnected);
      };
      
      this.aiAssistantInstance.onError = (error, details) => {
        Logger.log('error', '❌ AI Assistant instance error', { error, details });
        this.onError?.(error, details);
      };
      
      this.aiAssistantInstance.onSessionUpdate = (payload) => {
        Logger.log('info', '🔄 AI Assistant instance session update', payload);
        
        // Update local session ID if it changed
        if (payload.sessionId && payload.sessionId !== this.currentSessionId) {
          this.currentSessionId = payload.sessionId;
          Logger.log('info', '✅ Session ID updated from session update event', {
            newSessionId: payload.sessionId
          });
        }
        
        this.onSessionUpdate?.(payload);
      };
      
      this.aiAssistantInstance.onFunctionCall = async (payload) => {
        Logger.log('info', '🔧 AI Assistant instance function call', payload);
        
        try {
          // Execută function call prin DataFacade
          const result = await this.dataFacade.executeAIFunctionCall(
            payload,
            (response) => {
              // Trimite răspunsul înapoi către AI
              this.aiAssistantInstance.sendFunctionResponse(
                response.callId,
                response.functionName,
                response.success,
                response.result,
                response.error
              );
            }
          );
          
          Logger.log('info', '✅ Function call executed successfully', result);
          
          // Notifică callback-ul extern dacă există
          this.onFunctionCall?.(payload, result);
          
        } catch (error) {
          Logger.log('error', '❌ Function call execution failed', error);
          
          // Trimite eroarea înapoi către AI
          this.aiAssistantInstance.sendFunctionResponse(
            payload.callId || `fc_${Date.now()}`,
            payload.functionName,
            false,
            null,
            error.message
          );
        }
      };
      
      // Now connect using SocketFacade
      const result = await this.socketFacade.connectAIAssistant(this.businessId, this.userId, this.locationId);
      
      this.isConnected = result.success;
      Logger.log('info', '✅ Connected to WebSocket server via SocketFacade', result);
    } catch (error) {
      Logger.log('error', '❌ Failed to connect to WebSocket server', error);
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
      const channelName = `messages:${this.userId}`;
      
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
    Logger.log('info', 'Received message from WebSocket worker', { 
      dataType: typeof data, 
      data: data,
      hasType: !!data?.type,
      hasPayload: !!data?.data
    });
    
    const { type, data: payload } = data;
    
    const messageId = payload?.message_id || payload?.messageId || payload?.payload?.message_id;
    
    Logger.log('info', 'Processing worker message', { 
      type, 
      messageId, // ← Log messageId para detectare duplicate
      payloadType: typeof payload,
      payloadKeys: payload ? Object.keys(payload) : 'no payload'
    });
    
    switch (type) {
      case 'new_message':
        Logger.log('info', 'Handling new_message type', { messageId });
        this.handleNewMessage(payload);
        break;
        
      case 'ai_response':
        Logger.log('info', 'Handling ai_response type', { messageId });
        this.handleAIResponse(payload);
        break;
        
      case 'session_update':
        Logger.log('info', 'Handling session_update type');
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
    Logger.log('debug', 'Processing new message payload', payload);
    
    // Handle both direct payload and payload from event structure
    const messageData = payload.payload || payload;
    
    // Extract streaming flags
    const isChunk = messageData.isChunk || messageData.streaming?.isChunk || false;
    const isComplete = messageData.isComplete || messageData.streaming?.isComplete || false;
    
    // Try different field names for content (message, content)
    const content = messageData.content || messageData.message;
    const responseId = messageData.responseId || messageData.message_id || messageData.messageId;
    const timestamp = messageData.timestamp;
    
    // Try multiple locations for sessionId
    const sessionId = messageData.sessionId || 
                     messageData.session_id || 
                     messageData.session?.id ||
                     messageData.session?.sessionId ||
                     payload.session_id ||
                     payload.sessionId;
    
    Logger.log('info', 'Extracted message data', {
      content: content ? content.substring(0, 100) + '...' : 'NO CONTENT',
      responseId,
      timestamp,
      sessionId,
      currentSessionId: this.currentSessionId,
      hasContent: !!content,
      isChunk,
      isComplete,
      payloadKeys: Object.keys(messageData),
      hasSessionInPayload: !!sessionId
    });
    
    // Capture session ID from first message if we don't have one yet
    if (sessionId && !this.currentSessionId) {
      Logger.log('info', '🆕 Captured session ID from first message', { 
        sessionId,
        source: 'new_message'
      });
      this.currentSessionId = sessionId;
      
      // Notify session update callback to trigger localStorage save
      if (this.onSessionUpdate) {
        this.onSessionUpdate({
          sessionId: sessionId,
          status: 'active',
          metadata: {
            source: 'first_message',
            reason: 'Session ID captured from backend response'
          }
        });
      }
    } else if (sessionId && sessionId !== this.currentSessionId) {
      // Update session ID if it changed
      Logger.log('info', '🔄 Updating session ID from message', { 
        oldSessionId: this.currentSessionId, 
        newSessionId: sessionId 
      });
      this.currentSessionId = sessionId;
      
      // Notify session update
      if (this.onSessionUpdate) {
        this.onSessionUpdate({
          sessionId: sessionId,
          status: 'active',
          metadata: {
            source: 'message_update',
            reason: 'Session ID changed in message'
          }
        });
      }
    }
    
    if (content) {
      // Use current session ID if not provided in payload
      const finalSessionId = sessionId || this.currentSessionId;
      const messageId = responseId || `ai_${Date.now()}`;
      
      // Handle streaming chunks
      if (isChunk) {
        // This is a streaming chunk - concatenate with existing content
        Logger.log('debug', '📦 Received streaming chunk', {
          messageId,
          chunkLength: content.length,
          isComplete
        });
        
        // Get or create streaming message
        let streamingMessage = this.streamingMessages.get(messageId);
        
        if (!streamingMessage) {
          // First chunk - create new streaming message
          streamingMessage = {
            messageId: messageId,
            sessionId: finalSessionId,
            businessId: this.businessId,
            userId: 'agent',
            content: content,
            type: 'agent',
            timestamp: timestamp || new Date().toISOString(),
            isStreaming: !isComplete,
            isComplete: isComplete,
            metadata: { 
              source: 'websocket', 
              responseId: responseId,
              context: messageData.context,
              originalType: messageData.type,
              streaming: true
            }
          };
          
          this.streamingMessages.set(messageId, streamingMessage);
          
          Logger.log('debug', '🆕 Created new streaming message', {
            messageId,
            contentLength: streamingMessage.content.length
          });
        } else {
          // Subsequent chunk - concatenate content
          streamingMessage.content += content;
          streamingMessage.isComplete = isComplete;
          streamingMessage.isStreaming = !isComplete;
          
          Logger.log('debug', '➕ Concatenated chunk to streaming message', {
            messageId,
            totalLength: streamingMessage.content.length,
            isComplete
          });
        }
        
        // Notify UI about streaming update (only one callback)
        if (this.onMessageReceived) {
          this.onMessageReceived([streamingMessage]);
          Logger.log('debug', '📤 Notified onMessageReceived for streaming chunk');
        } else {
          Logger.log('warn', 'onMessageReceived callback not set for streaming chunk');
        }
        
        // If complete, remove from streaming messages map
        if (isComplete) {
          this.streamingMessages.delete(messageId);
          Logger.log('info', '✅ Streaming message completed', {
            messageId,
            finalLength: streamingMessage.content.length
          });
        }
      } else {
        // Not a streaming chunk - handle as complete message
        const aiMessage = {
          messageId: messageId,
          sessionId: finalSessionId,
          businessId: this.businessId,
          userId: 'agent',
          content: content,
          type: 'agent',
          timestamp: timestamp || new Date().toISOString(),
          isStreaming: false,
          isComplete: true,
          metadata: { 
            source: 'websocket', 
            responseId: responseId,
            context: messageData.context,
            originalType: messageData.type
          }
        };
        
        Logger.log('info', 'Created complete message object', {
          messageId: aiMessage.messageId,
          sessionId: aiMessage.sessionId,
          contentLength: aiMessage.content.length,
          timestamp: aiMessage.timestamp
        });
        
        if (this.onMessageReceived) {
          Logger.log('info', 'Calling onMessageReceived callback for complete message', { 
            messageCount: 1,
            sessionId: finalSessionId,
            messageId: aiMessage.messageId
          });
          this.onMessageReceived([aiMessage]);
        } else {
          Logger.log('warn', 'onMessageReceived callback not set for complete message');
        }
      }
    } else {
      Logger.log('warn', 'No content found in new message payload', payload);
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
    
    // Extract data from the actual payload structure
    const messageData = payload.payload || payload;
    const content = messageData.content || messageData.message;
    const message_id = messageData.message_id || messageData.messageId || messageData.responseId;
    const timestamp = messageData.timestamp;
    const context = messageData.context;
    const type = messageData.type;
    
    // Try multiple locations for sessionId
    const session_id = messageData.session_id || 
                      messageData.sessionId || 
                      messageData.session?.id ||
                      messageData.session?.sessionId ||
                      payload.session_id ||
                      payload.sessionId;
    
    Logger.log('info', 'Extracted AI response data', {
      content: content ? content.substring(0, 100) + '...' : 'NO CONTENT',
      message_id,
      session_id,
      timestamp,
      currentSessionId: this.currentSessionId,
      hasContent: !!content,
      payloadKeys: Object.keys(messageData),
      hasSessionInPayload: !!session_id
    });
    
    // Capture session ID from first AI response if we don't have one yet
    if (session_id && !this.currentSessionId) {
      Logger.log('info', '🆕 Captured session ID from first AI response', { 
        sessionId: session_id,
        source: 'ai_response'
      });
      this.currentSessionId = session_id;
      
      // Notify session update callback to trigger localStorage save
      if (this.onSessionUpdate) {
        this.onSessionUpdate({
          sessionId: session_id,
          status: 'active',
          metadata: {
            source: 'first_response',
            reason: 'Session ID captured from AI response'
          }
        });
      }
    } else if (session_id && session_id !== this.currentSessionId) {
      // Update session ID if it changed
      Logger.log('info', '🔄 Updating session ID from AI response', { 
        oldSessionId: this.currentSessionId, 
        newSessionId: session_id 
      });
      this.currentSessionId = session_id;
      
      // Notify session update
      if (this.onSessionUpdate) {
        this.onSessionUpdate({
          sessionId: session_id,
          status: 'active',
          metadata: {
            source: 'response_update',
            reason: 'Session ID changed in AI response'
          }
        });
      }
    }
    
    if (content) {
      // Use current session ID if not provided in payload
      const finalSessionId = session_id || this.currentSessionId;
      
      const aiMessage = {
        messageId: message_id || `ai_${Date.now()}`,
        sessionId: finalSessionId,
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
      
      Logger.log('info', 'Created AI response message object', {
        messageId: aiMessage.messageId,
        sessionId: aiMessage.sessionId,
        contentLength: aiMessage.content.length,
        timestamp: aiMessage.timestamp
      });
      
      if (this.onMessageReceived) {
        Logger.log('info', 'Calling onMessageReceived callback for AI response', { 
          messageCount: 1,
          sessionId: finalSessionId,
          messageId: aiMessage.messageId
        });
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
  async sendMessage(content, context = {}) {
    if (!this.isConnected || !this.aiAssistantInstance) {
      Logger.log('error', 'Cannot send message - WebSocket not connected', {
        isConnected: this.isConnected,
        hasInstance: !!this.aiAssistantInstance
      });
      throw new Error('WebSocket not connected');
    }

    try {
      Logger.log('info', '📤 AIWebSocketService sending message', {
        content: content.substring(0, 50) + '...',
        currentSessionId: this.currentSessionId,
        sessionIdType: this.currentSessionId ? typeof this.currentSessionId : 'null',
        hasContext: !!context,
        isFirstMessage: !this.currentSessionId,
        streamingMessagesCount: this.streamingMessages.size
      });
      
      // Set session ID in instance only if we have one
      // If currentSessionId is null, backend will create a new session
      if (this.currentSessionId && this.aiAssistantInstance) {
        this.aiAssistantInstance.setCurrentSessionId(this.currentSessionId);
        Logger.log('info', '✅ Set session ID in AI instance', { 
          sessionId: this.currentSessionId 
        });
      } else if (!this.currentSessionId && this.aiAssistantInstance) {
        // Clear session ID in instance to force new session creation
        this.aiAssistantInstance.setCurrentSessionId(null);
        Logger.log('info', '🆕 Sending message without sessionId - backend will create new session');
      }
      
      // Send message directly through instance
      const success = this.aiAssistantInstance.sendMessage(content, context);
      
      Logger.log('info', '✅ AIWebSocketService message sent', { 
        success,
        currentSessionId: this.currentSessionId,
        willCaptureSessionId: !this.currentSessionId
      });
      
      return success;
    } catch (error) {
      Logger.log('error', '❌ Failed to send message via WebSocket', error);
      throw error;
    }
  }

  // Set current session ID
  setCurrentSessionId(sessionId) {
    if (sessionId !== this.currentSessionId) {
      Logger.log('info', '🔄 Session ID updated in AIWebSocketService', { 
        oldSessionId: this.currentSessionId, 
        newSessionId: sessionId 
      });
      
      this.currentSessionId = sessionId;
      
      // Also set session ID in the AI Assistant instance
      if (this.aiAssistantInstance) {
        this.aiAssistantInstance.setCurrentSessionId(sessionId);
        Logger.log('info', '✅ Session ID set in AI Assistant instance');
      }
    }
  }

  // Send function response back to AI
  sendFunctionResponse(functionName, data, success = true, error = null) {
    if (!this.aiAssistantInstance) {
      Logger.log('error', '❌ Cannot send function response - no AI Assistant instance');
      return false;
    }

    Logger.log('info', '📤 Sending function response', {
      functionName,
      success,
      hasData: !!data,
      hasError: !!error
    });

    try {
      const result = this.aiAssistantInstance.sendFunctionResponse(functionName, data, success, error);
      Logger.log('info', '✅ Function response sent successfully');
      return result;
    } catch (error) {
      Logger.log('error', '❌ Failed to send function response', error);
      throw error;
    }
  }

  // Disconnect from WebSocket
  async disconnect() {
    Logger.log('info', 'Disconnecting from WebSocket server via SocketFacade...');
    
    try {
      // Use SocketFacade to disconnect
      await this.socketFacade.disconnectAIAssistant(this.businessId, this.userId, this.locationId);
      
      // Clear local instance
      if (this.aiAssistantInstance) {
        this.aiAssistantInstance.disconnect();
        this.aiAssistantInstance = null;
      }
      
      this.isConnected = false;
      this.onConnectionChange?.(false);
      
      Logger.log('info', 'WebSocket disconnected via SocketFacade');
    } catch (error) {
      Logger.log('error', 'Error during disconnect:', error);
      // Still set disconnected state even if error occurs
      this.isConnected = false;
      this.onConnectionChange?.(false);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.socketFacade.getAIAssistantStatus(this.businessId, this.userId, this.locationId);
  }

  // Cleanup and dispose
  async dispose() {
    Logger.log('info', 'AI WebSocket Service disposed');
    
    await this.disconnect();
    
    // Clear streaming messages
    this.streamingMessages.clear();
    
    // Clear callbacks
    this.onMessageReceived = null;
    this.onConnectionChange = null;
    this.onError = null;
    this.onReconnect = null;
    this.onSessionUpdate = null;
    this.onFunctionCall = null;
    this.onStreamingUpdate = null;
    
    // Clear AI Assistant instance
    this.aiAssistantInstance = null;
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
