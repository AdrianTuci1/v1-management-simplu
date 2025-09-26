/**
 * AgentWebSocketHandler - Gestionează comunicarea cu agenții prin WebSocket
 * 
 * Acest handler permite:
 * - Autentificarea agenților
 * - Executarea comenzilor de la agenți
 * - Modificarea query-urilor din aplicație
 * - Gestionarea aprobării/respingării schimbărilor
 */

import { db } from './db.js';
import { draftManager } from './draftManager.js';

export class AgentWebSocketHandler {
  constructor() {
    this.authenticatedAgents = new Map();
    this.messageHandlers = new Map();
    this.websocket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    this.initializeMessageHandlers();
  }

  // ========================================
  // WEBSOCKET CONNECTION
  // ========================================

  /**
   * Conectează la WebSocket pentru agenți
   * @param {string} url - URL-ul WebSocket-ului
   * @param {Object} options - Opțiuni de conexiune
   */
  async connect(url, options = {}) {
    try {
      this.websocket = new WebSocket(url);
      
      this.websocket.onopen = (event) => {
        console.log('Agent WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectionOpen(event);
      };
      
      this.websocket.onmessage = (event) => {
        this.handleMessage(event);
      };
      
      this.websocket.onclose = (event) => {
        console.log('Agent WebSocket disconnected');
        this.isConnected = false;
        this.onConnectionClose(event);
      };
      
      this.websocket.onerror = (error) => {
        console.error('Agent WebSocket error:', error);
        this.onConnectionError(error);
      };
      
    } catch (error) {
      console.error('Error connecting to Agent WebSocket:', error);
      throw error;
    }
  }

  /**
   * Deconectează de la WebSocket
   */
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
      this.isConnected = false;
    }
  }

  /**
   * Trimite un mesaj prin WebSocket
   * @param {string} event - Tipul evenimentului
   * @param {Object} payload - Datele mesajului
   */
  sendMessage(event, payload) {
    if (!this.isConnected || !this.websocket) {
      console.warn('Agent WebSocket not connected');
      return false;
    }

    try {
      const message = {
        event,
        payload,
        timestamp: new Date().toISOString()
      };
      
      this.websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // ========================================
  // MESSAGE HANDLING
  // ========================================

  /**
   * Inițializează handler-ii pentru mesaje
   */
  initializeMessageHandlers() {
    this.messageHandlers.set('agent_authenticate', this.handleAuthentication.bind(this));
    this.messageHandlers.set('agent_execute_command', this.handleExecuteCommand.bind(this));
    this.messageHandlers.set('agent_modify_query', this.handleModifyQuery.bind(this));
    this.messageHandlers.set('agent_approve_changes', this.handleApproveChanges.bind(this));
    this.messageHandlers.set('agent_reject_changes', this.handleRejectChanges.bind(this));
    this.messageHandlers.set('agent_ping', this.handlePing.bind(this));
  }

  /**
   * Gestionează mesajele primite
   * @param {MessageEvent} event - Evenimentul mesajului
   */
  async handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      const { event: eventType, payload, timestamp } = message;
      
      console.log('Received agent message:', eventType, payload);
      
      const handler = this.messageHandlers.get(eventType);
      if (handler) {
        await handler(payload);
      } else {
        console.warn('Unknown agent message type:', eventType);
      }
    } catch (error) {
      console.error('Error handling agent message:', error);
    }
  }

  // ========================================
  // AGENT AUTHENTICATION
  // ========================================

  /**
   * Gestionează autentificarea agenților
   * @param {Object} payload - Datele de autentificare
   */
  async handleAuthentication(payload) {
    try {
      const { sessionId, agentId, apiKey, permissions } = payload;
      
      // Verifică cheia API (în producție, ar trebui să fie validată cu serverul)
      const isValidKey = await this.validateApiKey(apiKey);
      if (!isValidKey) {
        this.sendMessage('agent_auth_failed', { 
          sessionId, 
          reason: 'Invalid API key' 
        });
        return;
      }
      
      // Creează sesiunea agentului
      const agentSession = {
        id: `agent_session_${Date.now()}`,
        sessionId,
        agentId,
        permissions: permissions || [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      
      await db.table('agentSessions').add(agentSession);
      
      // Adaugă agentul la lista de agenți autentificați
      this.authenticatedAgents.set(sessionId, agentSession);
      
      this.sendMessage('agent_auth_success', { 
        sessionId, 
        agentId,
        permissions: agentSession.permissions
      });
      
      console.log(`Agent ${agentId} authenticated successfully`);
      
    } catch (error) {
      console.error('Error handling agent authentication:', error);
      this.sendMessage('agent_auth_failed', { 
        sessionId: payload.sessionId, 
        reason: 'Authentication error' 
      });
    }
  }

  /**
   * Validează cheia API (placeholder - în producție ar trebui validată cu serverul)
   * @param {string} apiKey - Cheia API
   * @returns {Promise<boolean>} True dacă cheia este validă
   */
  async validateApiKey(apiKey) {
    // Placeholder - în producție ar trebui să valideze cu serverul
    return apiKey && apiKey.length > 10;
  }

  // ========================================
  // COMMAND EXECUTION
  // ========================================

  /**
   * Execută comenzi de la agenți
   * @param {Object} payload - Datele comenzii
   */
  async handleExecuteCommand(payload) {
    try {
      const { sessionId, commandId, repositoryType, operation, data } = payload;
      
      // Verifică dacă agentul este autentificat
      if (!this.authenticatedAgents.has(sessionId)) {
        this.sendMessage('agent_command_failed', { 
          sessionId, 
          commandId, 
          reason: 'Agent not authenticated' 
        });
        return;
      }
      
      // Salvează comanda în baza de date
      const agentCommand = {
        id: `command_${Date.now()}`,
        sessionId,
        commandId,
        repositoryType,
        operation,
        data,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      await db.table('agentCommands').add(agentCommand);
      
      // Execută comanda (placeholder - în producție ar trebui să execute comanda reală)
      const result = await this.executeCommand(operation, repositoryType, data);
      
      // Actualizează statusul comenzii
      await db.table('agentCommands').update(agentCommand.id, { 
        status: 'completed',
        result 
      });
      
      this.sendMessage('agent_command_completed', { 
        sessionId, 
        commandId, 
        result 
      });
      
    } catch (error) {
      console.error('Error executing agent command:', error);
      this.sendMessage('agent_command_failed', { 
        sessionId: payload.sessionId, 
        commandId: payload.commandId, 
        reason: error.message 
      });
    }
  }

  /**
   * Execută o comandă (placeholder)
   * @param {string} operation - Operațiunea
   * @param {string} repositoryType - Tipul repository-ului
   * @param {Object} data - Datele
   * @returns {Promise<Object>} Rezultatul comenzii
   */
  async executeCommand(operation, repositoryType, data) {
    // Placeholder - în producție ar trebui să execute comanda reală
    return {
      success: true,
      operation,
      repositoryType,
      data,
      timestamp: new Date().toISOString()
    };
  }

  // ========================================
  // QUERY MODIFICATION
  // ========================================

  /**
   * Modifică query-urile din aplicație
   * @param {Object} payload - Datele modificării
   */
  async handleModifyQuery(payload) {
    try {
      const { sessionId, repositoryType, modifications } = payload;
      
      // Verifică dacă agentul este autentificat
      if (!this.authenticatedAgents.has(sessionId)) {
        this.sendMessage('agent_query_modification_failed', { 
          sessionId, 
          reason: 'Agent not authenticated' 
        });
        return;
      }
      
      // Salvează modificarea query-ului
      const queryModification = {
        id: `query_mod_${Date.now()}`,
        sessionId,
        repositoryType,
        modifications,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      await db.table('agentQueryModifications').add(queryModification);
      
      // Aplică modificarea (placeholder - în producție ar trebui să aplice modificarea reală)
      const result = await this.applyQueryModification(repositoryType, modifications);
      
      this.sendMessage('agent_query_modified', { 
        sessionId, 
        repositoryType, 
        result 
      });
      
    } catch (error) {
      console.error('Error modifying query:', error);
      this.sendMessage('agent_query_modification_failed', { 
        sessionId: payload.sessionId, 
        reason: error.message 
      });
    }
  }

  /**
   * Aplică modificarea query-ului (placeholder)
   * @param {string} repositoryType - Tipul repository-ului
   * @param {Object} modifications - Modificările
   * @returns {Promise<Object>} Rezultatul modificării
   */
  async applyQueryModification(repositoryType, modifications) {
    // Placeholder - în producție ar trebui să aplice modificarea reală
    return {
      success: true,
      repositoryType,
      modifications,
      timestamp: new Date().toISOString()
    };
  }

  // ========================================
  // CHANGE APPROVAL
  // ========================================

  /**
   * Gestionează aprobarea schimbărilor
   * @param {Object} payload - Datele aprobării
   */
  async handleApproveChanges(payload) {
    try {
      const { sessionId, resourceType, resourceId, operation } = payload;
      
      // Verifică dacă agentul este autentificat
      if (!this.authenticatedAgents.has(sessionId)) {
        this.sendMessage('agent_approval_failed', { 
          sessionId, 
          reason: 'Agent not authenticated' 
        });
        return;
      }
      
      // Creează log-ul de management
      const managementLog = {
        id: `log_${Date.now()}`,
        resourceType,
        resourceId,
        operation,
        oldData: null, // Ar trebui să fie populat cu datele vechi
        newData: null, // Ar trebui să fie populat cu datele noi
        timestamp: new Date().toISOString(),
        approvedBy: sessionId,
        status: 'approved'
      };
      
      await db.table('managementLog').add(managementLog);
      
      this.sendMessage('agent_approval_success', { 
        sessionId, 
        resourceType, 
        resourceId, 
        operation 
      });
      
    } catch (error) {
      console.error('Error approving changes:', error);
      this.sendMessage('agent_approval_failed', { 
        sessionId: payload.sessionId, 
        reason: error.message 
      });
    }
  }

  /**
   * Gestionează respingerea schimbărilor
   * @param {Object} payload - Datele respingerii
   */
  async handleRejectChanges(payload) {
    try {
      const { sessionId, resourceType, resourceId, operation, reason } = payload;
      
      // Verifică dacă agentul este autentificat
      if (!this.authenticatedAgents.has(sessionId)) {
        this.sendMessage('agent_rejection_failed', { 
          sessionId, 
          reason: 'Agent not authenticated' 
        });
        return;
      }
      
      // Creează log-ul de management
      const managementLog = {
        id: `log_${Date.now()}`,
        resourceType,
        resourceId,
        operation,
        oldData: null,
        newData: null,
        timestamp: new Date().toISOString(),
        approvedBy: sessionId,
        status: 'rejected',
        reason
      };
      
      await db.table('managementLog').add(managementLog);
      
      this.sendMessage('agent_rejection_success', { 
        sessionId, 
        resourceType, 
        resourceId, 
        operation 
      });
      
    } catch (error) {
      console.error('Error rejecting changes:', error);
      this.sendMessage('agent_rejection_failed', { 
        sessionId: payload.sessionId, 
        reason: error.message 
      });
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Gestionează ping-ul de la agenți
   * @param {Object} payload - Datele ping-ului
   */
  async handlePing(payload) {
    const { sessionId } = payload;
    
    // Actualizează activitatea agentului
    if (this.authenticatedAgents.has(sessionId)) {
      const agent = this.authenticatedAgents.get(sessionId);
      agent.lastActivity = new Date().toISOString();
      
      await db.table('agentSessions').update(agent.id, { 
        lastActivity: agent.lastActivity 
      });
    }
    
    this.sendMessage('agent_pong', { sessionId });
  }

  /**
   * Gestionează deschiderea conexiunii
   * @param {Event} event - Evenimentul de deschidere
   */
  onConnectionOpen(event) {
    console.log('Agent WebSocket connection opened');
    // Poți adăuga logică suplimentară aici
  }

  /**
   * Gestionează închiderea conexiunii
   * @param {Event} event - Evenimentul de închidere
   */
  onConnectionClose(event) {
    console.log('Agent WebSocket connection closed');
    
    // Încearcă reconectarea dacă nu a fost o închidere intenționată
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        // Aici ar trebui să reconectezi
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  /**
   * Gestionează erorile conexiunii
   * @param {Event} error - Evenimentul de eroare
   */
  onConnectionError(error) {
    console.error('Agent WebSocket connection error:', error);
  }

  /**
   * Obține statusul conexiunii
   * @returns {Object} Statusul conexiunii
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      authenticatedAgents: this.authenticatedAgents.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Obține lista agenților autentificați
   * @returns {Array} Lista agenților
   */
  getAuthenticatedAgents() {
    return Array.from(this.authenticatedAgents.values());
  }

  /**
   * Verifică dacă un agent este autentificat
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {boolean} True dacă agentul este autentificat
   */
  isAgentAuthenticated(sessionId) {
    return this.authenticatedAgents.has(sessionId);
  }
}

// Export singleton instance
export const agentWebSocketHandler = new AgentWebSocketHandler();

// Export class for custom instances
export default AgentWebSocketHandler;
