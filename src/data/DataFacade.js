/**
 * DataFacade - Interfață unificată pentru toate funcționalitățile din directorul data
 * 
 * Acest facade simplifică accesul la:
 * - Repository-uri (appointments, patients, products, etc.)
 * - Commands (CRUD operations)
 * - WebSocket communication
 * - Draft management
 * - Agent integration
 * - Queue system
 */

// Import all repositories
import AuthRepository from './repositories/AuthRepository.js';
import BusinessInfoRepository from './repositories/BusinessInfoRepository.js';
import { ResourceRepository } from './repositories/ResourceRepository.js';
import StatisticsDataRepository from './repositories/StatisticsDataRepository.js';
import UserRolesRepository from './repositories/UserRolesRepository.js';
import { aiAssistantRepository } from './repositories/AIAssistantRepository.js';

// Import commands
import { AddCommand } from './commands/AddCommand.js';
import { UpdateCommand } from './commands/UpdateCommand.js';
import { DeleteCommand } from './commands/DeleteCommand.js';
import { GetCommand } from './commands/GetCommand.js';


// Import infrastructure
import { db } from './infrastructure/db.js';
import { enqueue, processQueue } from './queue/offlineQueue.js';
import { healthMonitor } from './infrastructure/healthMonitor.js';
import { draftManager } from './infrastructure/draftManager.js';
import { agentWebSocketHandler } from './infrastructure/agentWebSocketHandler.js';
import { agentQueryModifier } from './infrastructure/agentQueryModifier.js';
import { socketFacade } from './SocketFacade.js';

// Import invokers
import AuthInvoker from './invoker/AuthInvoker.js';
import BusinessInfoInvoker from './invoker/BusinessInfoInvoker.js';
import ResourceInvoker from './invoker/ResourceInvoker.js';
import StatisticsDataInvoker from './invoker/StatisticsDataInvoker.js';
import UserRolesInvoker from './invoker/UserRolesInvoker.js';

export class DataFacade {
  constructor() {
    this.repositories = new Map();
    this.invokers = new Map();
    this.isInitialized = false;
    this.healthListeners = new Set();
    this.socketFacade = socketFacade; // Reference to SocketFacade
    
    this.initializeRepositories();
    this.initializeInvokers();
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  initializeRepositories() {
    // Repository-uri existente
    this.repositories.set('auth', AuthRepository);
    this.repositories.set('businessInfo', BusinessInfoRepository);
    this.repositories.set('statistics', StatisticsDataRepository);
    this.repositories.set('userRoles', UserRolesRepository);
    this.repositories.set('aiAssistant', aiAssistantRepository);
    
    // Repository-uri pentru resurse (resource type singular pentru API, store name plural pentru IndexedDB)
    this.repositories.set('appointment', new ResourceRepository('appointment', 'appointments'));
    this.repositories.set('patient', new ResourceRepository('patient', 'patients'));
    this.repositories.set('product', new ResourceRepository('product', 'products'));
    this.repositories.set('medic', new ResourceRepository('medic', 'users'));
    this.repositories.set('treatment', new ResourceRepository('treatment', 'treatments'));
    this.repositories.set('sales', new ResourceRepository('sales', 'sales'));
    this.repositories.set('role', new ResourceRepository('role', 'roles'));
    this.repositories.set('permission', new ResourceRepository('permission', 'permissions'));
  }

  initializeInvokers() {
    this.invokers.set('auth', AuthInvoker);
    this.invokers.set('businessInfo', BusinessInfoInvoker);
    this.invokers.set('resource', ResourceInvoker);
    this.invokers.set('statistics', StatisticsDataInvoker);
    this.invokers.set('userRoles', UserRolesInvoker);
  }

  // ========================================
  // REPOSITORY ACCESS
  // ========================================

  /**
   * Obține un repository pentru un tip de resursă
   * @param {string} resourceType - Tipul de resursă (appointments, patients, etc.)
   * @returns {ResourceRepository} Repository-ul pentru tipul specificat
   */
  getRepository(resourceType) {
    const repository = this.repositories.get(resourceType);
    if (!repository) {
      throw new Error(`Repository for ${resourceType} not found`);
    }
    return repository;
  }

  /**
   * Obține toate repository-urile disponibile
   * @returns {Map} Map cu toate repository-urile
   */
  getAllRepositories() {
    return this.repositories;
  }

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Creează o nouă resursă
   * @param {string} resourceType - Tipul de resursă
   * @param {Object} data - Datele resursei
   * @returns {Promise<Object>} Resursa creată
   */
  async create(resourceType, data) {
    const repository = this.getRepository(resourceType);
    return await repository.add(data);
  }

  /**
   * Actualizează o resursă existentă
   * @param {string} resourceType - Tipul de resursă
   * @param {string} id - ID-ul resursei
   * @param {Object} data - Datele actualizate
   * @returns {Promise<Object>} Resursa actualizată
   */
  async update(resourceType, id, data) {
    const repository = this.getRepository(resourceType);
    return await repository.update(id, data);
  }

  /**
   * Șterge o resursă
   * @param {string} resourceType - Tipul de resursă
   * @param {string} id - ID-ul resursei
   * @returns {Promise<boolean>} True dacă ștergerea a reușit
   */
  async delete(resourceType, id) {
    const repository = this.getRepository(resourceType);
    return await repository.remove(id);
  }

  /**
   * Obține o resursă după ID
   * @param {string} resourceType - Tipul de resursă
   * @param {string} id - ID-ul resursei
   * @returns {Promise<Object>} Resursa găsită
   */
  async getById(resourceType, id) {
    const repository = this.getRepository(resourceType);
    return await repository.getById(id);
  }

  /**
   * Obține toate resursele de un tip
   * @param {string} resourceType - Tipul de resursă
   * @param {Object} params - Parametrii de query
   * @returns {Promise<Array>} Lista de resurse
   */
  async getAll(resourceType, params = {}) {
    const repository = this.getRepository(resourceType);
    return await repository.query(params);
  }

  // ========================================
  // COMMAND PATTERN
  // ========================================

  /**
   * Execută o comandă CRUD
   * @param {string} operation - Operațiunea (create, read, update, delete)
   * @param {string} resourceType - Tipul de resursă
   * @param {Object} data - Datele pentru operațiune
   * @param {string} id - ID-ul pentru update/delete
   * @returns {Promise<Object>} Rezultatul operațiunii
   */
  async executeCommand(operation, resourceType, data, id = null) {
    const repository = this.getRepository(resourceType);
    let command;

    switch (operation) {
      case 'create':
        command = new AddCommand(repository, data);
        break;
      case 'read':
        command = new GetCommand(repository, data);
        break;
      case 'update':
        command = new UpdateCommand(repository, id, data);
        break;
      case 'delete':
        command = new DeleteCommand(repository, id);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return await command.execute();
  }

  // ========================================
  // WEBSOCKET COMMUNICATION
  // ========================================

  /**
   * Conectează la WebSocket
   * @param {string} url - URL-ul WebSocket-ului
   */
  connectWebSocket(url) {
    connectWebSocket(url);
  }

  /**
   * Abonează-te la mesajele WebSocket
   * @param {Function} callback - Callback pentru mesaje
   * @returns {Function} Funcție pentru dezabonare
   */
  onWebSocketMessage(callback) {
    return onMessage(callback);
  }

  /**
   * Trimite un mesaj prin WebSocket
   * @param {string} event - Tipul evenimentului
   * @param {Object} payload - Datele mesajului
   */
  sendWebSocketMessage(event, payload) {
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
  // HEALTH MONITORING
  // ========================================

  /**
   * Pornește monitorizarea stării sistemului
   */
  startHealthMonitoring() {
    healthMonitor.startMonitoring();
  }

  /**
   * Oprește monitorizarea stării sistemului
   */
  stopHealthMonitoring() {
    healthMonitor.stopMonitoring();
  }

  /**
   * Adaugă un listener pentru schimbările de stare
   * @param {Function} callback - Callback pentru schimbările de stare
   * @returns {Function} Funcție pentru dezabonare
   */
  onHealthChange(callback) {
    return healthMonitor.addListener(callback);
  }

  /**
   * Obține starea curentă a sistemului
   * @returns {Object} Starea curentă
   */
  getHealthStatus() {
    return healthMonitor.getStatus();
  }

  /**
   * Verifică dacă sistemul poate face cereri către server
   * @returns {boolean} True dacă poate face cereri
   */
  canMakeRequests() {
    return healthMonitor.canMakeRequests();
  }

  /**
   * Execută un health check manual
   * @returns {Promise<boolean>} True dacă serverul este healthy
   */
  async performHealthCheck() {
    return await healthMonitor.checkServerHealth();
  }

  // ========================================
  // DRAFT MANAGEMENT
  // ========================================

  /**
   * Creează un draft pentru o operațiune temporară
   * @param {string} resourceType - Tipul de resursă
   * @param {Object} data - Datele draft-ului
   * @param {string} sessionId - ID-ul sesiunii (opțional)
   * @returns {Promise<Object>} Draft-ul creat
   */
  async createDraft(resourceType, data, sessionId = null) {
    return await draftManager.createDraft(resourceType, data, 'create', sessionId);
  }

  /**
   * Actualizează un draft existent
   * @param {string} draftId - ID-ul draft-ului
   * @param {Object} data - Datele actualizate
   * @returns {Promise<Object>} Draft-ul actualizat
   */
  async updateDraft(draftId, data) {
    return await draftManager.updateDraft(draftId, data);
  }

  /**
   * Confirmă un draft (devine ireversibil)
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  async commitDraft(draftId) {
    return await draftManager.commitDraft(draftId);
  }

  /**
   * Anulează un draft (reversibil)
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelDraft(draftId) {
    return await draftManager.cancelDraft(draftId);
  }

  /**
   * Obține un draft după ID
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Draft-ul găsit
   */
  async getDraft(draftId) {
    return await draftManager.getDraft(draftId);
  }

  /**
   * Obține toate draft-urile pentru un tip de resursă
   * @param {string} resourceType - Tipul de resursă
   * @returns {Promise<Array>} Lista de draft-uri
   */
  async getDraftsByResourceType(resourceType) {
    return await draftManager.getDraftsByResourceType(resourceType);
  }

  /**
   * Obține toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Array>} Lista de draft-uri
   */
  async getDraftsBySession(sessionId) {
    return await draftManager.getDraftsBySession(sessionId);
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Creează o nouă sesiune
   * @param {string} type - Tipul sesiunii
   * @param {Object} data - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea creată
   */
  async createSession(type, data = {}) {
    return await draftManager.createSession(type, data);
  }

  /**
   * Salvează o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @param {Object} sessionData - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea salvată
   */
  async saveSession(sessionId, sessionData) {
    return await draftManager.saveSession(sessionId, sessionData);
  }

  /**
   * Obține o sesiune după ID
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Sesiunea găsită
   */
  async getSession(sessionId) {
    return await draftManager.getSession(sessionId);
  }

  /**
   * Închide o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Sesiunea închisă
   */
  async closeSession(sessionId) {
    return await draftManager.closeSession(sessionId);
  }

  // ========================================
  // AGENT INTEGRATION
  // ========================================

  /**
   * Conectează la WebSocket pentru agenți
   * @param {string} url - URL-ul WebSocket-ului
   * @param {Object} options - Opțiuni de conexiune
   */
  async connectAgentWebSocket(url, options = {}) {
    return await agentWebSocketHandler.connect(url, options);
  }

  /**
   * Deconectează de la WebSocket pentru agenți
   */
  disconnectAgentWebSocket() {
    agentWebSocketHandler.disconnect();
  }

  /**
   * Obține statusul conexiunii pentru agenți
   * @returns {Object} Statusul conexiunii
   */
  getAgentWebSocketStatus() {
    return agentWebSocketHandler.getConnectionStatus();
  }

  /**
   * Obține lista agenților autentificați
   * @returns {Array} Lista agenților
   */
  getAuthenticatedAgents() {
    return agentWebSocketHandler.getAuthenticatedAgents();
  }

  /**
   * Verifică dacă un agent este autentificat
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {boolean} True dacă agentul este autentificat
   */
  isAgentAuthenticated(sessionId) {
    return agentWebSocketHandler.isAgentAuthenticated(sessionId);
  }

  /**
   * Modifică un query de la agent
   * @param {string} sessionId - ID-ul sesiunii
   * @param {string} resourceType - Tipul de resursă
   * @param {Object} modifications - Modificările query-ului
   * @returns {Promise<Object>} Rezultatul modificării
   */
  async modifyQueryFromAgent(sessionId, resourceType, modifications) {
    return await agentQueryModifier.modifyQuery(sessionId, resourceType, modifications);
  }

  /**
   * Revine la query-ul original
   * @param {string} sessionId - ID-ul sesiunii
   * @param {string} modificationId - ID-ul modificării
   * @returns {Promise<Object>} Rezultatul revenirii
   */
  async revertQueryModification(sessionId, modificationId) {
    return await agentQueryModifier.revertQueryModification(sessionId, modificationId);
  }

  /**
   * Obține modificările pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Array>} Lista de modificări
   */
  async getQueryModificationsForSession(sessionId) {
    return await agentQueryModifier.getModificationsForSession(sessionId);
  }

  /**
   * Obține statistici despre modificări
   * @returns {Promise<Object>} Statisticile modificărilor
   */
  async getQueryModificationStatistics() {
    return await agentQueryModifier.getModificationStatistics();
  }

  // ========================================
  // AI ASSISTANT INTEGRATION
  // ========================================

  /**
   * Generează ID-ul sesiunii pentru AI Assistant
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @returns {string} ID-ul sesiunii generate
   */
  generateAIAssistantSessionId(businessId, userId) {
    return this.repositories.get('aiAssistant').generateSessionId(businessId, userId);
  }

  /**
   * Încarcă sesiunea de astăzi pentru AI Assistant
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @param {string} locationId - ID-ul locației
   * @returns {Promise<Object>} Sesiunea încărcată
   */
  async loadTodayAIAssistantSession(businessId, userId, locationId) {
    return await this.repositories.get('aiAssistant').loadTodaySession(businessId, userId, locationId);
  }

  /**
   * Trimite un mesaj către AI Assistant prin repository
   * @param {string} sessionId - ID-ul sesiunii
   * @param {string} content - Conținutul mesajului
   * @param {Object} context - Contextul mesajului
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @param {string} locationId - ID-ul locației
   * @returns {Promise<Object>} Rezultatul trimiterii mesajului
   */
  async sendAIAssistantRepositoryMessage(sessionId, content, context, businessId, userId, locationId) {
    return await this.repositories.get('aiAssistant').sendMessage(sessionId, content, context, businessId, userId, locationId);
  }

  /**
   * Obține sesiunile active pentru AI Assistant
   * @param {string} businessId - ID-ul business-ului
   * @returns {Promise<Array>} Lista sesiunilor active
   */
  async getActiveAIAssistantSessions(businessId) {
    return await this.repositories.get('aiAssistant').getActiveSessions(businessId);
  }

  /**
   * Închide o sesiune AI Assistant
   * @param {string} sessionId - ID-ul sesiunii
   * @param {string} status - Statusul de închidere
   * @returns {Promise<boolean>} True dacă închiderea a reușit
   */
  async closeAIAssistantSession(sessionId, status = 'resolved') {
    return await this.repositories.get('aiAssistant').closeSession(sessionId, status);
  }

  /**
   * Obține statisticile sesiunilor AI Assistant
   * @param {string} businessId - ID-ul business-ului
   * @returns {Promise<Object>} Statisticile sesiunilor
   */
  async getAIAssistantSessionStats(businessId) {
    return await this.repositories.get('aiAssistant').getSessionStats(businessId);
  }

  /**
   * Caută mesaje în sesiunea AI Assistant
   * @param {string} sessionId - ID-ul sesiunii
   * @param {string} query - Query-ul de căutare
   * @param {number} limit - Limita de rezultate
   * @returns {Promise<Array>} Rezultatele căutării
   */
  async searchAIAssistantMessages(sessionId, query, limit = 20) {
    return await this.repositories.get('aiAssistant').searchMessages(sessionId, query, limit);
  }

  /**
   * Exportă datele sesiunii AI Assistant
   * @param {string} sessionId - ID-ul sesiunii
   * @param {string} format - Formatul de export
   * @returns {Promise<Object>} Datele exportate
   */
  async exportAIAssistantSession(sessionId, format = 'json') {
    return await this.repositories.get('aiAssistant').exportSession(sessionId, format);
  }

  /**
   * Obține sesiunea activă pentru un utilizator
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @returns {Promise<Object|null>} Sesiunea activă sau null
   */
  async getActiveAIAssistantSessionForUser(businessId, userId) {
    return await this.repositories.get('aiAssistant').getActiveSessionForUser(businessId, userId);
  }

  /**
   * Obține istoricul sesiunilor pentru un utilizator
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @param {number} limit - Limita de sesiuni
   * @returns {Promise<Object>} Istoricul sesiunilor
   */
  async getUserAIAssistantSessionHistory(businessId, userId, limit = 20) {
    return await this.repositories.get('aiAssistant').getUserSessionHistory(businessId, userId, limit);
  }

  /**
   * Obține o sesiune specifică după ID
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object|null>} Sesiunea sau null
   */
  async getAIAssistantSessionById(sessionId) {
    return await this.repositories.get('aiAssistant').getSessionById(sessionId);
  }

  /**
   * Încarcă o sesiune specifică și mesajele sale
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Sesiunea cu mesajele sale
   */
  async loadAIAssistantSession(sessionId) {
    return await this.repositories.get('aiAssistant').loadSession(sessionId);
  }

}

// Export singleton instance
export const dataFacade = new DataFacade();

// Export class for custom instances
export default DataFacade;