import { dataFacade } from '../data/DataFacade.js'
import { DraftAwareResourceRepository } from '../data/repositories/DraftAwareResourceRepository.js'
import { userManager } from '../business/userManager.js'

class UserService {
  constructor() {
    this.repository = new DraftAwareResourceRepository('users', 'medic')
    this.dataFacade = dataFacade
  }

  // Obține toți utilizatorii
  async getUsers(filters = {}) {
    try {
      const users = await this.dataFacade.getAll('medic', filters)
      
      return userManager.transformUsersForUI(users)
    } catch (error) {
      return []
    }
  }



  // Adaugă un utilizator nou
  async addUser(userData) {
    try {
      // Validare
      const validationResult = userManager.validateUser(userData)
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '))
      }

      // Transformare pentru API
      const apiData = userManager.transformUserForAPI(userData)
      
      const result = await this.dataFacade.create('medic', apiData)
      
      return userManager.transformUserForUI(result)
    } catch (error) {
      throw error
    }
  }

  // Actualizează un utilizator
  async updateUser(id, userData) {
    try {
      // Validare
      const validationResult = userManager.validateUser(userData, id)
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '))
      }

      // Transformare pentru API
      const apiData = userManager.transformUserForAPI(userData)
      
      const result = await this.dataFacade.update('medic', id, apiData)
      
      return userManager.transformUserForUI(result)
    } catch (error) {
      throw error
    }
  }

  // Șterge un utilizator
  async deleteUser(id) {
    try {
      await this.dataFacade.delete('medic', id)
      return true
    } catch (error) {
      throw error
    }
  }

  // Căutare utilizatori folosind resource queries
  async searchUsers(query, filters = {}) {
    try {
      // Extragem limit din filters sau folosim default
      const limit = filters.limit || 50;
      const additionalFilters = { ...filters };
      delete additionalFilters.limit; // Eliminăm limit din filters pentru a-l trimite separat
      
      // Încearcă mai întâi resource query pentru căutare eficientă prin DataFacade
      const users = await this.dataFacade.searchWithFallback(
        'medic',
        'medicName',
        query,
        limit,
        // Fallback method
        async (searchTerm, fallbackFilters) => {
          try {
            const searchFilters = {
              ...fallbackFilters,
              search: searchTerm
            }
            const users = await this.dataFacade.getAll('medic', searchFilters)
            return Array.isArray(users) ? users : []
          } catch (error) {
            // Fallback la IndexedDB
            try {
              const { indexedDb } = await import('../data/infrastructure/db.js');
              const cachedUsers = await indexedDb.searchUsers(searchTerm);
              console.log(`Found ${cachedUsers.length} users matching "${searchTerm}" from IndexedDB cache`);
              return cachedUsers;
            } catch (cacheError) {
              return [];
            }
          }
        },
        additionalFilters
      );
      
      // Transformăm fiecare utilizator pentru UI
      return userManager.transformUsersForUI(users);
    } catch (error) {
      return [];
    }
  }

  // Obține statistici despre utilizatori
  async getUserStats() {
    try {
      const users = await this.getUsers()
      return userManager.getUserStats(users)
    } catch (error) {
      throw error
    }
  }

  // Export utilizatori
  async exportUsers(format = 'json') {
    try {
      const users = await this.getUsers()
      return userManager.exportUsers(users, format)
    } catch (error) {
      throw error
    }
  }

  // ========================================
  // DRAFT MANAGEMENT
  // ========================================

  /**
   * Creează un draft pentru un utilizator
   * @param {Object} userData - Datele utilizatorului
   * @param {string} sessionId - ID-ul sesiunii (opțional)
   * @returns {Promise<Object>} Draft-ul creat
   */
  async createUserDraft(userData, sessionId = null) {
    // Validare
    const validationResult = userManager.validateUser(userData)
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join(', '))
    }

    // Transformare pentru API
    const apiData = userManager.transformUserForAPI(userData)
    
    return await this.dataFacade.createDraft('medic', apiData, sessionId)
  }

  /**
   * Actualizează un draft de utilizator
   * @param {string} draftId - ID-ul draft-ului
   * @param {Object} userData - Datele actualizate
   * @returns {Promise<Object>} Draft-ul actualizat
   */
  async updateUserDraft(draftId, userData) {
    // Validare
    const validationResult = userManager.validateUser(userData)
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join(', '))
    }

    // Transformare pentru API
    const apiData = userManager.transformUserForAPI(userData)
    
    return await this.dataFacade.updateDraft(draftId, apiData)
  }

  /**
   * Confirmă un draft de utilizator
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  async commitUserDraft(draftId) {
    return await this.dataFacade.commitDraft(draftId)
  }

  /**
   * Anulează un draft de utilizator
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelUserDraft(draftId) {
    return await this.dataFacade.cancelDraft(draftId)
  }

  /**
   * Obține draft-urile pentru utilizatori
   * @param {string} sessionId - ID-ul sesiunii (opțional)
   * @returns {Promise<Array>} Lista de draft-uri
   */
  async getUserDrafts(sessionId = null) {
    if (sessionId) {
      return await this.dataFacade.getDraftsBySession(sessionId)
    }
    return await this.dataFacade.getDraftsByResourceType('medic')
  }

  /**
   * Obține utilizatorii cu draft-uri incluse
   * @param {Object} params - Parametrii de query
   * @returns {Promise<Array>} Lista de utilizatori cu draft-uri
   */
  async getUsersWithDrafts(params = {}) {
    try {
      const users = await this.repository.queryWithDrafts(params)
      
      return userManager.transformUsersForUI(users)
    } catch (error) {
      return []
    }
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Creează o sesiune pentru utilizatori
   * @param {string} type - Tipul sesiunii
   * @param {Object} data - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea creată
   */
  async createUserSession(type, data = {}) {
    return await this.dataFacade.createSession(type, data)
  }

  /**
   * Salvează o sesiune de utilizatori
   * @param {string} sessionId - ID-ul sesiunii
   * @param {Object} sessionData - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea salvată
   */
  async saveUserSession(sessionId, sessionData) {
    return await this.dataFacade.saveSession(sessionId, sessionData)
  }

  /**
   * Obține utilizatorii pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Array>} Lista de utilizatori pentru sesiune
   */
  async getUsersForSession(sessionId) {
    try {
      const users = await this.repository.getResourcesForSession(sessionId)
      
      return userManager.transformUsersForUI(users)
    } catch (error) {
      return []
    }
  }

  /**
   * Confirmă toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  async commitAllUserDraftsForSession(sessionId) {
    return await this.repository.commitAllDraftsForSession(sessionId)
  }

  /**
   * Anulează toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelAllUserDraftsForSession(sessionId) {
    return await this.repository.cancelAllDraftsForSession(sessionId)
  }
}

export const userService = new UserService()
