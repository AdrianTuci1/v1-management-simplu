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

// Import all repositories via barrel
import {
  AuthRepository,
  ResourceRepository,
  StatisticsDataRepository,
  UserRolesRepository,
  aiAssistantRepository,
} from './repositories/index.js';

// Import DraftAwareResourceRepository
import { DraftAwareResourceRepository } from './repositories/DraftAwareResourceRepository.js';

// Import ResourceSearchRepository
import { resourceSearchRepository } from './repositories/ResourceSearchRepository.js';

// Import commands
import { AddCommand } from './commands/AddCommand.js';
import { UpdateCommand } from './commands/UpdateCommand.js';
import { DeleteCommand } from './commands/DeleteCommand.js';
import { GetCommand } from './commands/GetCommand.js';



import { healthMonitor } from './infrastructure/healthMonitor.js';
import { draftManager } from './infrastructure/draftManager.js';
import { agentWebSocketHandler } from './infrastructure/agentWebSocketHandler.js';
import { agentQueryModifier } from './infrastructure/agentQueryModifier.js';
import { socketFacade } from './SocketFacade.js';

// Import invokers via barrel
import {
  AuthInvoker,
  ResourceInvoker,
  StatisticsDataInvoker,
  UserRolesInvoker,
} from './invoker/index.js';

export class DataFacade {
  constructor() {
    this.repositories = new Map();
    this.invokers = new Map();
    this.isInitialized = false;
    this.healthListeners = new Set();
    this.socketFacade = socketFacade; // Reference to SocketFacade
    this.searchRepository = resourceSearchRepository; // Reference to ResourceSearchRepository
    
    this.initializeRepositories();
    this.initializeInvokers();
    // Ensure SocketFacade is initialized once
    try { this.socketFacade.initialize(); } catch (_) {}
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  initializeRepositories() {
    // Repository-uri existente
    this.repositories.set('auth', AuthRepository);
    this.repositories.set('statistics', StatisticsDataRepository);
    this.repositories.set('userRoles', UserRolesRepository);
    this.repositories.set('aiAssistant', aiAssistantRepository);
    
    // Repository-uri pentru resurse cu suport draft (DraftAwareResourceRepository)
    this.repositories.set('appointment', new DraftAwareResourceRepository('appointment', 'appointment'));
    this.repositories.set('patient', new DraftAwareResourceRepository('patient', 'patient'));
    this.repositories.set('product', new DraftAwareResourceRepository('product', 'product'));
    this.repositories.set('medic', new DraftAwareResourceRepository('medic', 'user'));
    this.repositories.set('treatment', new DraftAwareResourceRepository('treatment', 'treatment'));
    this.repositories.set('sales', new DraftAwareResourceRepository('sale', 'sale'));
    this.repositories.set('role', new DraftAwareResourceRepository('role', 'role'));
    this.repositories.set('permission', new DraftAwareResourceRepository('permission', 'permission'));
    this.repositories.set('setting', new DraftAwareResourceRepository('setting', 'setting'));
    
    // Repository-uri pentru date dentare și planuri de tratament
    this.repositories.set('dental-chart', new DraftAwareResourceRepository('dental-chart', 'dental-chart'));
    this.repositories.set('plan', new DraftAwareResourceRepository('plan', 'plan'));
    
    // Repository-uri pentru facturi și clienți
    this.repositories.set('invoice', new DraftAwareResourceRepository('invoice', 'invoice'));
    this.repositories.set('invoice-client', new DraftAwareResourceRepository('invoice-client', 'invoice-clients'));
    
    // Repository-uri speciale pentru draft-uri și sesiuni
    this.repositories.set('draft', new DraftAwareResourceRepository('draft', 'drafts'));
    this.repositories.set('session', new DraftAwareResourceRepository('session', 'session'));
    
    // Repository pentru rapoarte
    this.repositories.set('report', new DraftAwareResourceRepository('report', 'report'));
  }

  initializeInvokers() {
    this.invokers.set('auth', AuthInvoker);
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
  // SEARCH OPERATIONS
  // ========================================

  /**
   * Caută resurse folosind ResourceSearchRepository
   * @param {string} resourceType - Tipul resursei
   * @param {string} searchField - Câmpul în care să caute
   * @param {string} searchTerm - Termenul de căutare
   * @param {number} limit - Limita de rezultate
   * @param {Object} additionalFilters - Filtre suplimentare
   * @returns {Promise<Array>} Rezultatele căutării
   */
  async searchByField(resourceType, searchField, searchTerm, limit = 50, additionalFilters = {}) {
    return await this.searchRepository.searchByCustomField(
      resourceType,
      searchField,
      searchTerm,
      limit,
      additionalFilters
    );
  }

  /**
   * Caută resurse cu suport pentru fallback
   * @param {string} resourceType - Tipul resursei
   * @param {string} searchField - Câmpul în care să caute
   * @param {string} searchTerm - Termenul de căutare
   * @param {number} limit - Limita de rezultate
   * @param {Function} fallbackMethod - Metoda de fallback
   * @param {Object} additionalFilters - Filtre suplimentare
   * @returns {Promise<Array>} Rezultatele căutării
   */
  async searchWithFallback(resourceType, searchField, searchTerm, limit = 50, fallbackMethod = null, additionalFilters = {}) {
    return await this.searchRepository.searchWithFallback(
      resourceType,
      searchField,
      searchTerm,
      limit,
      fallbackMethod,
      additionalFilters
    );
  }

  /**
   * Caută resurse cu multiple câmpuri
   * @param {string} resourceType - Tipul resursei
   * @param {Object} searchFields - Obiect cu câmpuri și termeni de căutare
   * @param {number} limit - Limita de rezultate
   * @param {Object} additionalFilters - Filtre suplimentare
   * @returns {Promise<Array>} Rezultatele căutării
   */
  async searchByMultipleFields(resourceType, searchFields, limit = 50, additionalFilters = {}) {
    return await this.searchRepository.searchByMultipleFields(
      resourceType,
      searchFields,
      limit,
      additionalFilters
    );
  }

  /**
   * Caută resurse cu fuzzy matching
   * @param {string} resourceType - Tipul resursei
   * @param {string} searchField - Câmpul în care să caute
   * @param {string} searchTerm - Termenul de căutare
   * @param {number} limit - Limita de rezultate
   * @param {Object} additionalFilters - Filtre suplimentare
   * @returns {Promise<Array>} Rezultatele căutării
   */
  async fuzzySearch(resourceType, searchField, searchTerm, limit = 50, additionalFilters = {}) {
    return await this.searchRepository.fuzzySearch(
      resourceType,
      searchField,
      searchTerm,
      limit,
      additionalFilters
    );
  }

  /**
   * Obține rezultate din cache
   * @param {string} resourceType - Tipul resursei
   * @param {string} searchField - Câmpul de căutare
   * @param {string} searchTerm - Termenul de căutare
   * @returns {Array|null} Rezultatele din cache sau null
   */
  getCachedSearchResults(resourceType, searchField, searchTerm) {
    return this.searchRepository.getCachedResults(resourceType, searchField, searchTerm);
  }

  /**
   * Curăță cache-ul de căutări
   */
  clearSearchCache() {
    this.searchRepository.clearAllCache();
  }

  /**
   * Obține statistici despre cache-ul de căutări
   * @returns {Object} Statisticile cache-ului
   */
  getSearchCacheStats() {
    return this.searchRepository.getCacheStats();
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
    this.socketFacade.connectWebSocket(url);
  }

  /**
   * Abonează-te la mesajele WebSocket
   * @param {Function} callback - Callback pentru mesaje
   * @returns {Function} Funcție pentru dezabonare
   */
  onWebSocketMessage(callback) {
    return this.socketFacade.onWebSocketMessage(callback);
  }

  /**
   * Trimite un mesaj prin WebSocket
   * @param {string} event - Tipul evenimentului
   * @param {Object} payload - Datele mesajului
   */
  sendWebSocketMessage(event, payload) {
    this.socketFacade.sendWebSocketMessage(event, payload);
  }

  /**
   * Obține statusul conexiunii WebSocket
   * @returns {string} Statusul conexiunii
   */
  getWebSocketStatus() {
    return this.socketFacade.getWebSocketStatus();
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
   * Încarcă istoricul mesajelor pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @param {number} limit - Limita de mesaje (opțional)
   * @param {string} before - Timestamp pentru paginare (opțional)
   * @returns {Promise<Array>} Lista mesajelor
   */
  async loadAIAssistantMessageHistory(sessionId, limit = null, before = null) {
    return await this.repositories.get('aiAssistant').loadMessageHistory(sessionId, limit, before);
  }

  /**
   * Adaugă un mesaj local în IndexedDB
   * @param {Object} message - Mesajul de adăugat
   * @returns {Promise<Object>} Mesajul adăugat
   */
  async addLocalAIAssistantMessage(message) {
    return await this.repositories.get('aiAssistant').addLocalMessage(message);
  }

  /**
   * Obține mesajele locale pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @param {number} limit - Limita de mesaje
   * @returns {Promise<Array>} Lista mesajelor locale
   */
  async getLocalAIAssistantMessages(sessionId, limit = 50) {
    return await this.repositories.get('aiAssistant').getLocalMessages(sessionId, limit);
  }

  /**
   * Obține o sesiune locală din IndexedDB
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object|null>} Sesiunea sau null
   */
  async getLocalAIAssistantSession(sessionId) {
    return await this.repositories.get('aiAssistant').getLocalSession(sessionId);
  }

  /**
   * Salvează o sesiune local în IndexedDB
   * @param {Object} session - Sesiunea de salvat
   * @returns {Promise<Object>} Sesiunea salvată
   */
  async saveLocalAIAssistantSession(session) {
    return await this.repositories.get('aiAssistant').saveLocalSession(session);
  }

  /**
   * Generează ID-ul sesiunii pentru sesiuni zilnice
   * @param {string} businessId - ID-ul business-ului
   * @param {string} userId - ID-ul utilizatorului
   * @returns {string} ID-ul sesiunii generat
   */
  generateAIAssistantSessionId(businessId, userId) {
    return this.repositories.get('aiAssistant').generateSessionId(businessId, userId);
  }

  /**
   * Parsează ID-ul sesiunii
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Object} Obiect cu businessId, userId, timestamp
   */
  parseAIAssistantSessionId(sessionId) {
    return this.repositories.get('aiAssistant').parseSessionId(sessionId);
  }

  /**
   * Verifică dacă ID-ul sesiunii este valid
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {boolean} True dacă este valid
   */
  isValidAIAssistantSessionId(sessionId) {
    return this.repositories.get('aiAssistant').isValidSessionId(sessionId);
  }

  /**
   * Curăță datele vechi din IndexedDB
   * @param {number} daysToKeep - Numărul de zile de păstrat
   * @returns {Promise<void>}
   */
  async cleanupOldAIAssistantData(daysToKeep = 30) {
    return await this.repositories.get('aiAssistant').cleanupOldData(daysToKeep);
  }

}

// Export singleton instance
export const dataFacade = new DataFacade();

// Export class for custom instances
export default DataFacade;