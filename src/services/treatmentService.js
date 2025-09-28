import { dataFacade } from '../data/DataFacade.js'
import { socketFacade } from '../data/SocketFacade.js'
import { DraftAwareResourceRepository } from '../data/repositories/DraftAwareResourceRepository.js'
import { resourceSearchRepository } from '../data/repositories/ResourceSearchRepository.js'
import treatmentManager from '../business/treatmentManager.js'

class TreatmentService {
  constructor() {
    this.repository = new DraftAwareResourceRepository('treatments', 'treatment')
    this.dataFacade = dataFacade
    this.socketFacade = socketFacade
  }

  // Obține toate tratamentele
  async getTreatments(params = {}) {
    try {
      const treatments = await this.dataFacade.getAll('treatment', params)
      
      // Transformăm fiecare tratament pentru UI
      return treatments.map(treatment => 
        treatmentManager.transformTreatmentForUI(treatment)
      )
    } catch (error) {
      return []
    }
  }

  // Obține tratamentele după categorie
  async getTreatmentsByCategory(category) {
    const params = { category }
    const result = await this.getTreatments(params)
    return Array.isArray(result) ? result : []
  }

  // Obține tratamentele după tip
  async getTreatmentsByType(treatmentType) {
    const params = { treatmentType }
    const result = await this.getTreatments(params)
    return Array.isArray(result) ? result : []
  }

  // Adaugă un tratament nou
  async addTreatment(treatmentData) {
    // Validare
    treatmentManager.validateTreatment(treatmentData)
    
    // Transformare pentru API
    const transformedData = treatmentManager.transformTreatmentForAPI(treatmentData)
    
    return await this.dataFacade.create('treatment', transformedData)
  }

  // Actualizează un tratament existent
  async updateTreatment(id, treatmentData) {
    // Validare
    treatmentManager.validateTreatment(treatmentData)
    
    // Transformare pentru API
    const transformedData = treatmentManager.transformTreatmentForAPI(treatmentData)
    
    return await this.dataFacade.update('treatment', id, transformedData)
  }

  // Șterge un tratament
  async deleteTreatment(id) {
    return await this.dataFacade.delete('treatment', id)
  }

  // Obține un tratament după ID
  async getTreatmentById(id) {
    return this.repository.getById(id)
  }

  // Obține tratamentele cu limitare pentru paginare
  async getTreatmentsWithLimit(params = {}, limit = 50, offset = 0) {
    const allParams = {
      ...params,
      limit,
      offset
    }
    const result = await this.getTreatments(allParams)
    return Array.isArray(result) ? result : []
  }

  // Obține statistici pentru tratamente
  async getStatistics() {
    return treatmentManager.getStatistics()
  }

  // Filtrează tratamentele
  async filterTreatments(treatments, filters = {}) {
    return treatmentManager.filterTreatments(treatments, filters)
  }

  // Sortează tratamentele
  async sortTreatments(treatments, sortBy = 'treatmentType', sortOrder = 'asc') {
    return treatmentManager.sortTreatments(treatments, sortBy, sortOrder)
  }

  // Exportă tratamentele
  async exportTreatments(treatments, format = 'json') {
    return treatmentManager.exportTreatments(treatments, format)
  }

  // Căutare tratamente folosind resource queries
  async searchTreatments(query, limit = 50) {
    try {
      // Folosește ResourceSearchRepository pentru căutare eficientă
      const treatments = await resourceSearchRepository.searchWithFallback(
        'treatment',
        'treatmentType',
        query,
        limit,
        // Fallback method
        async (searchTerm, fallbackFilters) => {
          try {
            const searchFilters = {
              search: searchTerm,
              limit: fallbackFilters.limit || limit
            }
            const treatments = await this.dataFacade.getAll('treatment', searchFilters)
            return Array.isArray(treatments) ? treatments : []
          } catch (fallbackError) {
            return []
          }
        }
      );
      
      // Transformăm fiecare tratament pentru UI
      return treatments.map(treatment => 
        treatmentManager.transformTreatmentForUI(treatment)
      );
    } catch (error) {
      return [];
    }
  }

  // ========================================
  // DRAFT MANAGEMENT
  // ========================================

  /**
   * Creează un draft pentru un tratament
   * @param {Object} treatmentData - Datele tratamentului
   * @param {string} sessionId - ID-ul sesiunii (opțional)
   * @returns {Promise<Object>} Draft-ul creat
   */
  async createTreatmentDraft(treatmentData, sessionId = null) {
    // Validare
    treatmentManager.validateTreatment(treatmentData)
    
    // Transformare pentru API
    const transformedData = treatmentManager.transformTreatmentForAPI(treatmentData)
    
    return await this.dataFacade.createDraft('treatment', transformedData, sessionId)
  }

  /**
   * Actualizează un draft de tratament
   * @param {string} draftId - ID-ul draft-ului
   * @param {Object} treatmentData - Datele actualizate
   * @returns {Promise<Object>} Draft-ul actualizat
   */
  async updateTreatmentDraft(draftId, treatmentData) {
    // Validare
    treatmentManager.validateTreatment(treatmentData)
    
    // Transformare pentru API
    const transformedData = treatmentManager.transformTreatmentForAPI(treatmentData)
    
    return await this.dataFacade.updateDraft(draftId, transformedData)
  }

  /**
   * Confirmă un draft de tratament
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  async commitTreatmentDraft(draftId) {
    return await this.dataFacade.commitDraft(draftId)
  }

  /**
   * Anulează un draft de tratament
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelTreatmentDraft(draftId) {
    return await this.dataFacade.cancelDraft(draftId)
  }

  /**
   * Obține draft-urile pentru tratamente
   * @param {string} sessionId - ID-ul sesiunii (opțional)
   * @returns {Promise<Array>} Lista de draft-uri
   */
  async getTreatmentDrafts(sessionId = null) {
    if (sessionId) {
      return await this.dataFacade.getDraftsBySession(sessionId)
    }
    return await this.dataFacade.getDraftsByResourceType('treatment')
  }

  /**
   * Obține tratamentele cu draft-uri incluse
   * @param {Object} params - Parametrii de query
   * @returns {Promise<Array>} Lista de tratamente cu draft-uri
   */
  async getTreatmentsWithDrafts(params = {}) {
    try {
      const treatments = await this.repository.queryWithDrafts(params)
      
      return treatments.map(treatment => 
        treatmentManager.transformTreatmentForUI(treatment)
      )
    } catch (error) {
      return []
    }
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Creează o sesiune pentru tratamente
   * @param {string} type - Tipul sesiunii
   * @param {Object} data - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea creată
   */
  async createTreatmentSession(type, data = {}) {
    return await this.dataFacade.createSession(type, data)
  }

  /**
   * Salvează o sesiune de tratamente
   * @param {string} sessionId - ID-ul sesiunii
   * @param {Object} sessionData - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea salvată
   */
  async saveTreatmentSession(sessionId, sessionData) {
    return await this.dataFacade.saveSession(sessionId, sessionData)
  }

  /**
   * Obține tratamentele pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Array>} Lista de tratamente pentru sesiune
   */
  async getTreatmentsForSession(sessionId) {
    try {
      const treatments = await this.repository.getResourcesForSession(sessionId)
      
      return treatments.map(treatment => 
        treatmentManager.transformTreatmentForUI(treatment)
      )
    } catch (error) {
      return []
    }
  }

  /**
   * Confirmă toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  async commitAllTreatmentDraftsForSession(sessionId) {
    return await this.repository.commitAllDraftsForSession(sessionId)
  }

  /**
   * Anulează toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelAllTreatmentDraftsForSession(sessionId) {
    return await this.repository.cancelAllDraftsForSession(sessionId)
  }
}

export default new TreatmentService()
