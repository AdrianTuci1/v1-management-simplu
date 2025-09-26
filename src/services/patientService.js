import { dataFacade } from '../data/DataFacade.js'
import { DraftAwareResourceRepository } from '../data/repositories/DraftAwareResourceRepository.js'
import { resourceSearchRepository } from '../data/repositories/ResourceSearchRepository.js'
import patientManager from '../business/patientManager.js'


class PatientService {
  constructor() {
    this.repository = new DraftAwareResourceRepository('patients', 'patients')
    this.dataFacade = dataFacade
  }

  // Obține pacienții cu parametri de filtrare
  async getPatients(params = {}) {
    try {
      const patients = await this.dataFacade.getAll('patients', params)
      
      // Transformăm fiecare pacient pentru UI
      return patients.map(patient => 
        patientManager.transformPatientForUI(patient)
      )
    } catch (error) {
      console.error('Error getting patients:', error)
      return []
    }
  }

  // Obține pacienții pentru o pagină specifică
  async getPatientsByPage(page = 1, limit = 20, filters = {}) {
    const params = {
      ...filters,
      limit,
      offset: (page - 1) * limit,
    }

    const result = await this.getPatients(params)
    return Array.isArray(result) ? result : []
  }

  // Obține pacienții după nume (căutare) folosind resource queries
  async searchPatients(searchTerm, limit = 50) {
    try {
      // Folosește ResourceSearchRepository pentru căutare eficientă
      const patients = await resourceSearchRepository.searchWithFallback(
        'patientName',
        searchTerm,
        limit,
        // Fallback method
        async (searchTerm, fallbackFilters) => {
          const params = {
            search: searchTerm,
            limit: fallbackFilters.limit || limit,
            sortBy: 'name',
            sortOrder: 'asc'
          }
          const result = await this.getPatients(params)
          return Array.isArray(result) ? result : []
        }
      );
      
      // Transformăm fiecare pacient pentru UI
      return patients.map(patient => 
        patientManager.transformPatientForUI(patient)
      );
    } catch (error) {
      console.error('Error searching patients by name:', error);
      return [];
    }
  }

  // Obține un pacient după ID
  async getPatientById(id) {
    const params = { id }
    const patients = await this.getPatients(params)
    return patients.length > 0 ? patients[0] : null
  }

  // Adaugă un pacient nou
  async addPatient(patientData) {
    // Validare
    patientManager.validatePatient(patientData)
    
    // Transformare pentru API
    const transformedData = patientManager.transformPatientForAPI(patientData)
    
    return await this.dataFacade.create('patients', transformedData)
  }

  // Actualizează un pacient existent
  async updatePatient(id, patientData) {
    // Validare
    patientManager.validatePatient(patientData)
    
    // Transformare pentru API
    const transformedData = patientManager.transformPatientForAPI(patientData)
    
    return await this.dataFacade.update('patients', id, transformedData)
  }

  // Șterge un pacient
  async deletePatient(id) {
    return await this.dataFacade.delete('patients', id)
  }

  // Obține statistici despre pacienți
  async getPatientStats() {
    try {
      const allPatients = await this.getPatients({ limit: 1000 })
      
      const stats = {
        total: allPatients.length,
        active: allPatients.filter(p => p.status === 'active').length,
        inactive: allPatients.filter(p => p.status === 'inactive').length,
        newThisMonth: allPatients.filter(p => {
          const createdAt = new Date(p.createdAt)
          const now = new Date()
          return createdAt.getMonth() === now.getMonth() && 
                 createdAt.getFullYear() === now.getFullYear()
        }).length
      }
      
      return stats
    } catch (error) {
      console.error('Error getting patient stats:', error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        newThisMonth: 0
      }
    }
  }

  // Exportă pacienții în format CSV
  async exportPatients(format = 'csv') {
    try {
      const patients = await this.getPatients({ limit: 10000 })
      return patientManager.exportPatients(patients, format)
    } catch (error) {
      console.error('Error exporting patients:', error)
      throw new Error('Eroare la exportul pacienților')
    }
  }

  // ========================================
  // DRAFT MANAGEMENT
  // ========================================

  /**
   * Creează un draft pentru un pacient
   * @param {Object} patientData - Datele pacientului
   * @param {string} sessionId - ID-ul sesiunii (opțional)
   * @returns {Promise<Object>} Draft-ul creat
   */
  async createPatientDraft(patientData, sessionId = null) {
    // Validare
    patientManager.validatePatient(patientData)
    
    // Transformare pentru API
    const transformedData = patientManager.transformPatientForAPI(patientData)
    
    return await this.dataFacade.createDraft('patients', transformedData, sessionId)
  }

  /**
   * Actualizează un draft de pacient
   * @param {string} draftId - ID-ul draft-ului
   * @param {Object} patientData - Datele actualizate
   * @returns {Promise<Object>} Draft-ul actualizat
   */
  async updatePatientDraft(draftId, patientData) {
    // Validare
    patientManager.validatePatient(patientData)
    
    // Transformare pentru API
    const transformedData = patientManager.transformPatientForAPI(patientData)
    
    return await this.dataFacade.updateDraft(draftId, transformedData)
  }

  /**
   * Confirmă un draft de pacient
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  async commitPatientDraft(draftId) {
    return await this.dataFacade.commitDraft(draftId)
  }

  /**
   * Anulează un draft de pacient
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelPatientDraft(draftId) {
    return await this.dataFacade.cancelDraft(draftId)
  }

  /**
   * Obține draft-urile pentru pacienți
   * @param {string} sessionId - ID-ul sesiunii (opțional)
   * @returns {Promise<Array>} Lista de draft-uri
   */
  async getPatientDrafts(sessionId = null) {
    if (sessionId) {
      return await this.dataFacade.getDraftsBySession(sessionId)
    }
    return await this.dataFacade.getDraftsByResourceType('patients')
  }

  /**
   * Obține pacienții cu draft-uri incluse
   * @param {Object} params - Parametrii de query
   * @returns {Promise<Array>} Lista de pacienți cu draft-uri
   */
  async getPatientsWithDrafts(params = {}) {
    try {
      const patients = await this.repository.queryWithDrafts(params)
      
      // Transformăm fiecare pacient pentru UI
      return patients.map(patient => 
        patientManager.transformPatientForUI(patient)
      )
    } catch (error) {
      console.error('Error getting patients with drafts:', error)
      return []
    }
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Creează o sesiune pentru pacienți
   * @param {string} type - Tipul sesiunii
   * @param {Object} data - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea creată
   */
  async createPatientSession(type, data = {}) {
    return await this.dataFacade.createSession(type, data)
  }

  /**
   * Salvează o sesiune de pacienți
   * @param {string} sessionId - ID-ul sesiunii
   * @param {Object} sessionData - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea salvată
   */
  async savePatientSession(sessionId, sessionData) {
    return await this.dataFacade.saveSession(sessionId, sessionData)
  }

  /**
   * Obține pacienții pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Array>} Lista de pacienți pentru sesiune
   */
  async getPatientsForSession(sessionId) {
    try {
      const patients = await this.repository.getResourcesForSession(sessionId)
      
      // Transformăm fiecare pacient pentru UI
      return patients.map(patient => 
        patientManager.transformPatientForUI(patient)
      )
    } catch (error) {
      console.error('Error getting patients for session:', error)
      return []
    }
  }

  /**
   * Confirmă toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  async commitAllPatientDraftsForSession(sessionId) {
    return await this.repository.commitAllDraftsForSession(sessionId)
  }

  /**
   * Anulează toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelAllPatientDraftsForSession(sessionId) {
    return await this.repository.cancelAllDraftsForSession(sessionId)
  }
}

export default new PatientService()
