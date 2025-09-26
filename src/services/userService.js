import { dataFacade } from '../data/DataFacade.js'
import { DraftAwareResourceRepository } from '../data/repositories/DraftAwareResourceRepository.js'
import { resourceSearchRepository } from '../data/repositories/ResourceSearchRepository.js'
import { userManager } from '../business/userManager.js'

class UserService {
  constructor() {
    this.repository = new DraftAwareResourceRepository('users', 'users')
    this.dataFacade = dataFacade
  }

  // Obține toți utilizatorii
  async getUsers(filters = {}) {
    try {
      const users = await this.dataFacade.getAll('users', filters)
      
      return userManager.transformUsersForUI(users)
    } catch (error) {
      console.error('Error getting users:', error)
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
      
      const result = await this.dataFacade.create('users', apiData)
      
      return userManager.transformUserForUI(result)
    } catch (error) {
      console.error('Error adding user:', error)
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
      
      const result = await this.dataFacade.update('users', id, apiData)
      
      return userManager.transformUserForUI(result)
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  // Șterge un utilizator
  async deleteUser(id) {
    try {
      await this.dataFacade.delete('users', id)
      return true
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  // Căutare utilizatori folosind resource queries
  async searchUsers(query, limit = 50, filters = {}) {
    try {
      // Încearcă mai întâi resource query pentru căutare eficientă
      const users = await resourceSearchRepository.searchWithFallback(
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
            const users = await this.dataFacade.getAll('users', searchFilters)
            return Array.isArray(users) ? users : []
          } catch (error) {
            console.error('Fallback search failed:', error)
            // Fallback la IndexedDB
            try {
              const { indexedDb } = await import('../data/infrastructure/db.js');
              const cachedUsers = await indexedDb.searchUsers(searchTerm);
              console.log(`Found ${cachedUsers.length} users matching "${searchTerm}" from IndexedDB cache`);
              return cachedUsers;
            } catch (cacheError) {
              console.error('Error searching users from IndexedDB:', cacheError);
              return [];
            }
          }
        },
        filters
      );
      
      // Transformăm fiecare utilizator pentru UI
      return userManager.transformUsersForUI(users);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Obține statistici despre utilizatori
  async getUserStats() {
    try {
      const users = await this.getUsers()
      return userManager.getUserStats(users)
    } catch (error) {
      console.error('Error getting user stats:', error)
      throw error
    }
  }

  // Export utilizatori
  async exportUsers(format = 'json') {
    try {
      const users = await this.getUsers()
      return userManager.exportUsers(users, format)
    } catch (error) {
      console.error('Error exporting users:', error)
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
    
    return await this.dataFacade.createDraft('users', apiData, sessionId)
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
    return await this.dataFacade.getDraftsByResourceType('users')
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
      console.error('Error getting users with drafts:', error)
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
      console.error('Error getting users for session:', error)
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
