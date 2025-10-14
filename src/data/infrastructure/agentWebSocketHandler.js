/**
 * AgentWebSocketHandler - Gestionează AI function calls și le execută prin DataFacade
 * 
 * Flow:
 * 1. AI trimite ai_function_call prin WebSocket
 * 2. websocketAiAssistant.handleFunctionCall() primește payload
 * 3. Se apelează agentWebSocketHandler.executeAIFunctionCall()
 * 4. Se execută prin DataFacade
 * 5. Se returnează răspunsul către AI prin WebSocket
 */

import { db } from './db.js';

export class AgentWebSocketHandler {
  constructor() {
    this.dataFacade = null; // Va fi injectat de DataFacade
    this.authenticatedAgents = new Map();
    this.pendingFunctionCalls = new Map(); // functionCallId -> { resolve, reject, timestamp }
    this.messageHandlers = new Map();
    
    this.initializeMessageHandlers();
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Setează DataFacade pentru executarea comenzilor
   * @param {DataFacade} dataFacade - Instanța DataFacade
   */
  setDataFacade(dataFacade) {
    this.dataFacade = dataFacade;
    console.log('✅ AgentWebSocketHandler: DataFacade connected');
  }

  /**
   * Inițializează handler-ii pentru mesaje
   */
  initializeMessageHandlers() {
    this.messageHandlers.set('createResource', this.handleCreateResource.bind(this));
    this.messageHandlers.set('updateResource', this.handleUpdateResource.bind(this));
    this.messageHandlers.set('deleteResource', this.handleDeleteResource.bind(this));
    this.messageHandlers.set('getResource', this.handleGetResource.bind(this));
    this.messageHandlers.set('queryResources', this.handleQueryResources.bind(this));
    this.messageHandlers.set('searchResources', this.handleSearchResources.bind(this));
  }

  // ========================================
  // AI FUNCTION CALL EXECUTION
  // ========================================

  /**
   * Execută un AI function call și returnează rezultatul
   * @param {Object} payload - Payload-ul de la AI
   * @param {Function} responseCallback - Callback pentru trimiterea răspunsului înapoi
   * @returns {Promise<Object>} Rezultatul execuției
   */
  async executeAIFunctionCall(payload, responseCallback = null) {
    const { functionName, parameters, callId, timestamp } = payload;
    
    console.log('🔧 AgentWebSocketHandler: Executing AI function call', {
      functionName,
      callId,
      hasParameters: !!parameters
    });

    try {
      // Verifică dacă DataFacade este disponibil
      if (!this.dataFacade) {
        throw new Error('DataFacade not initialized');
      }

      // Loghează apelul funcției în DB
      const functionCall = {
        id: callId || `fc_${Date.now()}`,
        functionName,
        parameters,
        timestamp: timestamp || new Date().toISOString(),
        status: 'executing'
      };
      
      await db.table('aiFunctionCalls').add(functionCall).catch(() => {
        // Ignoră eroarea dacă tabela nu există
        console.warn('Could not log function call to DB');
      });

      // Execută funcția prin handler specific
      const handler = this.messageHandlers.get(functionName);
      let result;
      
      if (handler) {
        result = await handler(parameters);
      } else {
        throw new Error(`Unknown function: ${functionName}`);
      }

      // Actualizează statusul în DB
      await db.table('aiFunctionCalls').update(functionCall.id, {
        status: 'completed',
        result,
        completedAt: new Date().toISOString()
      }).catch(() => {});

      console.log('✅ AgentWebSocketHandler: Function call executed successfully', {
        functionName,
        callId,
        hasResult: !!result
      });

      // Trimite răspunsul înapoi prin callback dacă există
      if (responseCallback) {
        responseCallback({
          callId: functionCall.id,
          functionName,
          success: true,
          result,
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: true,
        result,
        callId: functionCall.id
      };

    } catch (error) {
      console.error('❌ AgentWebSocketHandler: Function call failed', {
        functionName,
        callId,
        error: error.message
      });

      // Loghează eroarea în DB
      await db.table('aiFunctionCalls').update(callId || `fc_${Date.now()}`, {
        status: 'failed',
        error: error.message,
        completedAt: new Date().toISOString()
      }).catch(() => {});

      // Trimite eroarea înapoi prin callback dacă există
      if (responseCallback) {
        responseCallback({
          callId: callId || `fc_${Date.now()}`,
          functionName,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: false,
        error: error.message,
        callId: callId || `fc_${Date.now()}`
      };
    }
  }

  // ========================================
  // RESOURCE HANDLERS
  // ========================================

  /**
   * Handler pentru createResource
   * @param {Object} parameters - { resourceType, data }
   */
  async handleCreateResource(parameters) {
    const { resourceType, data } = parameters;
    
    console.log('📝 Creating resource:', resourceType, data);
    
    if (!resourceType || !data) {
      throw new Error('Missing resourceType or data');
    }

    const result = await this.dataFacade.create(resourceType, data);
    
    return {
      operation: 'create',
      resourceType,
      resource: result
    };
  }

  /**
   * Handler pentru updateResource
   * @param {Object} parameters - { resourceType, id, data }
   */
  async handleUpdateResource(parameters) {
    const { resourceType, id, data } = parameters;
    
    console.log('✏️ Updating resource:', resourceType, id);
    
    if (!resourceType || !id || !data) {
      throw new Error('Missing resourceType, id, or data');
    }

    const result = await this.dataFacade.update(resourceType, id, data);
    
    return {
      operation: 'update',
      resourceType,
      id,
      resource: result
    };
  }

  /**
   * Handler pentru deleteResource
   * @param {Object} parameters - { resourceType, id }
   */
  async handleDeleteResource(parameters) {
    const { resourceType, id } = parameters;
    
    console.log('🗑️ Deleting resource:', resourceType, id);
    
    if (!resourceType || !id) {
      throw new Error('Missing resourceType or id');
    }

    const result = await this.dataFacade.delete(resourceType, id);
    
    return {
      operation: 'delete',
      resourceType,
      id,
      success: result
    };
  }

  /**
   * Handler pentru getResource
   * @param {Object} parameters - { resourceType, id }
   */
  async handleGetResource(parameters) {
    const { resourceType, id } = parameters;
    
    console.log('🔍 Getting resource:', resourceType, id);
    
    if (!resourceType || !id) {
      throw new Error('Missing resourceType or id');
    }

    const result = await this.dataFacade.getById(resourceType, id);
    
    return {
      operation: 'get',
      resourceType,
      id,
      resource: result
    };
  }

  /**
   * Handler pentru queryResources
   * @param {Object} parameters - { resourceType, params }
   */
  async handleQueryResources(parameters) {
    const { resourceType, params = {} } = parameters;
    
    console.log('📋 Querying resources:', resourceType, params);
    
    if (!resourceType) {
      throw new Error('Missing resourceType');
    }

    const result = await this.dataFacade.getAll(resourceType, params);
    
    return {
      operation: 'query',
      resourceType,
      params,
      resources: result,
      count: result?.length || 0
    };
  }

  /**
   * Handler pentru searchResources
   * @param {Object} parameters - { resourceType, searchField, searchTerm, limit, additionalFilters }
   */
  async handleSearchResources(parameters) {
    const { 
      resourceType, 
      searchField, 
      searchTerm, 
      limit = 50, 
      additionalFilters = {} 
    } = parameters;
    
    console.log('🔎 Searching resources:', resourceType, searchField, searchTerm);
    
    if (!resourceType || !searchField || !searchTerm) {
      throw new Error('Missing resourceType, searchField, or searchTerm');
    }

    const result = await this.dataFacade.searchByField(
      resourceType,
      searchField,
      searchTerm,
      limit,
      additionalFilters
    );
    
    return {
      operation: 'search',
      resourceType,
      searchField,
      searchTerm,
      resources: result,
      count: result?.length || 0
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Obține statusul handler-ului
   * @returns {Object} Status info
   */
  getStatus() {
    return {
      hasDataFacade: !!this.dataFacade,
      availableFunctions: Array.from(this.messageHandlers.keys()),
      authenticatedAgents: this.authenticatedAgents.size,
      pendingCalls: this.pendingFunctionCalls.size
    };
  }

  /**
   * Curăță apelurile vechi pendinte
   */
  cleanupPendingCalls() {
    const now = Date.now();
    const timeout = 30000; // 30 secunde
    
    for (const [callId, call] of this.pendingFunctionCalls.entries()) {
      if (now - call.timestamp > timeout) {
        call.reject(new Error('Function call timeout'));
        this.pendingFunctionCalls.delete(callId);
      }
    }
  }
}

// Export singleton instance
export const agentWebSocketHandler = new AgentWebSocketHandler();

// Export class for custom instances
export default AgentWebSocketHandler;

