/**
 * SocketFacade - Interfață unificată pentru toate funcționalitățile WebSocket
 * 
 * Acest facade simplifică accesul la:
 * - WebSocket communication
 * - AI Assistant WebSocket operations
 * - Agent resource queries
 * - Draft management via WebSocket
 * - Real-time notifications
 */

import { connectWebSocket, onMessage, sendMessage, getConnectionStatus } from './infrastructure/websocketClient.js';
import { createWebSocketAIAssistant } from './infrastructure/websocketAiAssistant.js';

// Logger utility
class Logger {
  static log(level, message, data = null) {
    if (import.meta.env.VITE_DEMO_MODE === 'true') return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[SocketFacade ${level.toUpperCase()}] ${timestamp}: ${message}`;
    
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

export class SocketFacade {
  constructor() {
    this.aiAssistantInstances = new Map(); // Store AI Assistant instances
    this.messageListeners = new Set(); // General message listeners
    this.resourceListeners = new Map(); // Resource-specific listeners
    this.agentListeners = new Set(); // Agent-specific listeners
    this.isInitialized = false;
    
    Logger.log('info', 'SocketFacade initialized');
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Inițializează SocketFacade
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      Logger.log('info', 'Initializing SocketFacade...');
      
      // Set up general WebSocket message listeners
      this.setupMessageListeners();
      
      this.isInitialized = true;
      Logger.log('info', 'SocketFacade initialized successfully');
    } catch (error) {
      Logger.log('error', 'Error initializing SocketFacade:', error);
      throw error;
    }
  }

  /**
   * Configurează listener-ele pentru mesaje WebSocket
   */
  setupMessageListeners() {
    // Listen for general messages
    onMessage((message) => {
      Logger.log('debug', 'General WebSocket message received', message);
      
      // Notify general listeners
      this.messageListeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          Logger.log('error', 'Error in message listener callback:', error);
        }
      });
      
      // Handle specific message types
      this.handleSpecificMessage(message);
    });
  }

  /**
   * Gestionează mesaje specifice
   */
  handleSpecificMessage(message) {
    switch (message.type) {
      case 'agent_resource_query_result':
      case 'agent_resource_query_error':
      case 'agent_draft_created':
      case 'agent_draft_updated':
      case 'agent_draft_committed':
      case 'agent_draft_cancelled':
      case 'agent_drafts_listed':
      case 'agent_request_error':
        // Notify agent listeners
        this.agentListeners.forEach(callback => {
          try {
            callback(message);
          } catch (error) {
            Logger.log('error', 'Error in agent listener callback:', error);
          }
        });
        break;
        
      case 'resource_update':
        // Notify resource-specific listeners
        if (message.data && message.data.resourceType) {
          const listeners = this.resourceListeners.get(message.data.resourceType);
          if (listeners) {
            listeners.forEach(callback => {
              try {
                callback(message);
              } catch (error) {
                Logger.log('error', 'Error in resource listener callback:', error);
              }
            });
          }
        }
        break;
    }
  }

  // ========================================
  // GENERAL WEBSOCKET OPERATIONS
  // ========================================

  /**
   * Conectează la WebSocket
   * @param {string} url - URL-ul WebSocket-ului
   */
  connectWebSocket(url) {
    Logger.log('info', 'Connecting to WebSocket', { url });
    connectWebSocket(url);
  }

  /**
   * Abonează-te la mesajele WebSocket
   * @param {Function} callback - Callback pentru mesaje
   * @returns {Function} Funcție pentru dezabonare
   */
  onWebSocketMessage(callback) {
    this.messageListeners.add(callback);
    Logger.log('debug', 'Added WebSocket message listener');
    
    return () => {
      this.messageListeners.delete(callback);
      Logger.log('debug', 'Removed WebSocket message listener');
    };
  }

  /**
   * Abonează-te la mesajele pentru un tip de resursă specific
   * @param {string} resourceType - Tipul de resursă
   * @param {Function} callback - Callback pentru mesaje
   * @returns {Function} Funcție pentru dezabonare
   */
  onResourceMessage(resourceType, callback) {
    if (!this.resourceListeners.has(resourceType)) {
      this.resourceListeners.set(resourceType, new Set());
    }
    
    const listeners = this.resourceListeners.get(resourceType);
    listeners.add(callback);
    Logger.log('debug', 'Added resource message listener', { resourceType });
    
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.resourceListeners.delete(resourceType);
      }
      Logger.log('debug', 'Removed resource message listener', { resourceType });
    };
  }

  /**
   * Abonează-te la mesajele de la agent
   * @param {Function} callback - Callback pentru mesaje de la agent
   * @returns {Function} Funcție pentru dezabonare
   */
  onAgentMessage(callback) {
    this.agentListeners.add(callback);
    Logger.log('debug', 'Added agent message listener');
    
    return () => {
      this.agentListeners.delete(callback);
      Logger.log('debug', 'Removed agent message listener');
    };
  }

  /**
   * Trimite un mesaj prin WebSocket
   * @param {string} event - Tipul evenimentului
   * @param {Object} payload - Datele mesajului
   */
  sendWebSocketMessage(event, payload) {
    Logger.log('debug', 'Sending WebSocket message', { event, payload });
    sendMessage(event, payload);
  }

  /**
   * Obține statusul conexiunii WebSocket
   * @returns {string} Statusul conexiunii
   */
  getWebSocketStatus() {
    return getConnectionStatus();
  }

  // ========================================
  // AI ASSISTANT WEBSOCKET OPERATIONS
  // ========================================

  /**
   * Creează o instanță AI Assistant
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @param {string} locationId - ID-ul locației (opțional)
   * @returns {Object} Instanța AI Assistant
   */
  createAIAssistant(businessId, userId, locationId = null) {
    const instanceKey = `${businessId}:${userId}:${locationId || 'default'}`;
    
    if (!this.aiAssistantInstances.has(instanceKey)) {
      const aiAssistant = createWebSocketAIAssistant(businessId, userId, locationId);
      this.aiAssistantInstances.set(instanceKey, aiAssistant);
      Logger.log('info', 'Created AI Assistant instance', { instanceKey });
    }
    
    return this.aiAssistantInstances.get(instanceKey);
  }

  /**
   * Conectează AI Assistant
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @param {string} locationId - ID-ul locației (opțional)
   * @returns {Promise<Object>} Rezultatul conexiunii
   */
  async connectAIAssistant(businessId, userId, locationId = null) {
    const aiAssistant = this.createAIAssistant(businessId, userId, locationId);
    await aiAssistant.connect();
    
    // Send connect event via WebSocket
    this.sendWebSocketMessage('ai_assistant_connect', {
      businessId,
      userId,
      locationId,
      timestamp: new Date().toISOString()
    });
    
    Logger.log('info', 'AI Assistant connected', { businessId, userId, locationId });
    
    return {
      success: true,
      status: aiAssistant.getConnectionStatus(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Deconectează AI Assistant
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @param {string} locationId - ID-ul locației (opțional)
   * @returns {Promise<Object>} Rezultatul deconectării
   */
  async disconnectAIAssistant(businessId, userId, locationId = null) {
    const instanceKey = `${businessId}:${userId}:${locationId || 'default'}`;
    const aiAssistant = this.aiAssistantInstances.get(instanceKey);
    
    if (aiAssistant) {
      aiAssistant.disconnect();
      this.aiAssistantInstances.delete(instanceKey);
      Logger.log('info', 'AI Assistant disconnected', { instanceKey });
    }
    
    // Send disconnect event via WebSocket
    this.sendWebSocketMessage('ai_assistant_disconnect', {
      businessId,
      userId,
      locationId,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Trimite un mesaj prin AI Assistant
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @param {string} content - Conținutul mesajului
   * @param {Object} context - Contextul mesajului
   * @param {string} locationId - ID-ul locației (opțional)
   * @returns {Promise<Object>} Rezultatul trimiterii
   */
  async sendAIAssistantMessage(businessId, userId, content, context = {}, locationId = null) {
    const aiAssistant = this.createAIAssistant(businessId, userId, locationId);
    
    // Setează callback-urile pentru mesaje (dacă nu sunt deja setate)
    if (!aiAssistant.onMessageReceived) {
      aiAssistant.onMessageReceived = (messages) => {
        Logger.log('debug', 'AI Assistant message received via SocketFacade:', messages);
      };
    }

    if (!aiAssistant.onError) {
      aiAssistant.onError = (error, details) => {
        Logger.log('error', 'AI Assistant error via SocketFacade:', error, details);
      };
    }

    // Conectează dacă nu este conectat (isConnected este proprietate, nu funcție)
    if (aiAssistant && !aiAssistant.isConnected) {
      await aiAssistant.connect();
    }

    // Trimite mesajul
    const success = aiAssistant.sendMessage(content, context);
    
    return {
      success,
      message: content,
      context,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obține statusul AI Assistant
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @param {string} locationId - ID-ul locației (opțional)
   * @returns {Object} Statusul conexiunii
   */
  getAIAssistantStatus(businessId, userId, locationId = null) {
    const instanceKey = `${businessId}:${userId}:${locationId || 'default'}`;
    const aiAssistant = this.aiAssistantInstances.get(instanceKey);
    
    if (!aiAssistant) {
      return {
        isConnected: false,
        hasInstance: false,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      ...aiAssistant.getConnectionStatus(),
      hasInstance: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Setează session ID-ul pentru AI Assistant
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @param {string} sessionId - ID-ul sesiunii
   * @param {string} locationId - ID-ul locației (opțional)
   */
  setAIAssistantSessionId(businessId, userId, sessionId, locationId = null) {
    const instanceKey = `${businessId}:${userId}:${locationId || 'default'}`;
    const aiAssistant = this.aiAssistantInstances.get(instanceKey);
    
    if (aiAssistant) {
      aiAssistant.setCurrentSessionId(sessionId);
      Logger.log('debug', 'AI Assistant session ID set via SocketFacade', { sessionId });
    } else {
      Logger.log('warn', 'AI Assistant instance not found for setting session ID', { instanceKey });
    }
  }

  /**
   * Obține session ID-ul curent al AI Assistant
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @param {string} locationId - ID-ul locației (opțional)
   * @returns {string|null} Session ID-ul curent sau null
   */
  getAIAssistantSessionId(businessId, userId, locationId = null) {
    const instanceKey = `${businessId}:${userId}:${locationId || 'default'}`;
    const aiAssistant = this.aiAssistantInstances.get(instanceKey);
    
    if (aiAssistant) {
      return aiAssistant.currentSessionId;
    }
    
    return null;
  }

  /**
   * Obține instanța AI Assistant (dacă există)
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @param {string} locationId - ID-ul locației (opțional)
   * @returns {Object|null} Instanța AI Assistant sau null
   */
  getAIAssistantInstance(businessId, userId, locationId = null) {
    const instanceKey = `${businessId}:${userId}:${locationId || 'default'}`;
    return this.aiAssistantInstances.get(instanceKey) || null;
  }

  // ========================================
  // AI ASSISTANT SESSION EVENTS
  // ========================================

  /**
   * Trimite eveniment de încărcare sesiune AI Assistant
   */
  sendAIAssistantSessionLoaded(businessId, userId, sessionId, locationId = null) {
    this.sendWebSocketMessage('ai_assistant_load_session', {
      businessId,
      userId,
      locationId,
      sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Trimite eveniment de închidere sesiune AI Assistant
   */
  sendAIAssistantSessionClosed(sessionId, status = 'resolved') {
    this.sendWebSocketMessage('ai_assistant_close_session', {
      sessionId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Trimite eveniment de căutare mesaje AI Assistant
   */
  sendAIAssistantMessageSearch(sessionId, query, limit, resultsCount) {
    this.sendWebSocketMessage('ai_assistant_search_messages', {
      sessionId,
      query,
      limit,
      resultsCount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Trimite eveniment de export sesiune AI Assistant
   */
  sendAIAssistantSessionExport(sessionId, format, exportSize) {
    this.sendWebSocketMessage('ai_assistant_export_session', {
      sessionId,
      format,
      exportSize,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Trimite eveniment de statistici AI Assistant
   */
  sendAIAssistantStats(businessId, stats) {
    this.sendWebSocketMessage('ai_assistant_get_stats', {
      businessId,
      stats,
      timestamp: new Date().toISOString()
    });
  }

  // ========================================
  // AI AGENT RESOURCE AND DRAFT EVENTS
  // ========================================

  /**
   * Trimite rezultatul interogării de resurse către agent
   */
  sendAgentResourceQueryResult(sessionId, resourceType, operation, results, totalCount) {
    this.sendWebSocketMessage('agent_resource_query_result', {
      sessionId,
      resourceType,
      operation,
      results,
      totalCount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Trimite eroarea interogării de resurse către agent
   */
  sendAgentResourceQueryError(sessionId, resourceType, error) {
    this.sendWebSocketMessage('agent_resource_query_error', {
      sessionId,
      resourceType,
      error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Trimite notificarea de creare draft către agent
   */
  sendAgentDraftCreated(sessionId, resourceType, operation, draftId, draftData, businessId, locationId, userId) {
    this.sendWebSocketMessage('agent_draft_created', {
      sessionId,
      resourceType,
      operation,
      draftId,
      draftData,
      businessId,
      locationId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Trimite notificarea de actualizare draft către agent
   */
  sendAgentDraftUpdated(sessionId, draftId, draftData, businessId, locationId, userId) {
    this.sendWebSocketMessage('agent_draft_updated', {
      sessionId,
      draftId,
      draftData,
      businessId,
      locationId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Trimite notificarea de confirmare draft către agent
   */
  sendAgentDraftCommitted(sessionId, draftId, result, businessId, locationId, userId) {
    this.sendWebSocketMessage('agent_draft_committed', {
      sessionId,
      draftId,
      result,
      businessId,
      locationId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Trimite notificarea de anulare draft către agent
   */
  sendAgentDraftCancelled(sessionId, draftId, result, businessId, locationId, userId) {
    this.sendWebSocketMessage('agent_draft_cancelled', {
      sessionId,
      draftId,
      result,
      businessId,
      locationId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Trimite lista de draft-uri către agent
   */
  sendAgentDraftsListed(sessionId, resourceType, drafts, draftCount, businessId, locationId, userId) {
    this.sendWebSocketMessage('agent_drafts_listed', {
      sessionId,
      resourceType,
      drafts,
      draftCount,
      businessId,
      locationId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Trimite eroarea de la agent
   */
  sendAgentRequestError(sessionId, resourceType, error) {
    this.sendWebSocketMessage('agent_request_error', {
      sessionId,
      resourceType,
      error,
      timestamp: new Date().toISOString()
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Obține informații despre SocketFacade
   * @returns {Object} Informații despre SocketFacade
   */
  getSystemInfo() {
    return {
      isInitialized: this.isInitialized,
      aiAssistantInstances: this.aiAssistantInstances.size,
      messageListeners: this.messageListeners.size,
      resourceListeners: this.resourceListeners.size,
      agentListeners: this.agentListeners.size,
      websocketStatus: this.getWebSocketStatus()
    };
  }

  /**
   * Curățare și dezalocare
   */
  dispose() {
    Logger.log('info', 'SocketFacade disposed');
    
    // Disconnect all AI Assistant instances
    this.aiAssistantInstances.forEach((aiAssistant, key) => {
      aiAssistant.disconnect();
      Logger.log('debug', 'Disposed AI Assistant instance', { key });
    });
    this.aiAssistantInstances.clear();
    
    // Clear all listeners
    this.messageListeners.clear();
    this.resourceListeners.clear();
    this.agentListeners.clear();
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const socketFacade = new SocketFacade();

// Export class for custom instances
export default SocketFacade;
