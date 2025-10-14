/**
 * DraftAwareResourceRepository - Repository extins cu suport pentru draft-uri
 * 
 * Acest repository extinde ResourceRepository cu funcționalități de draft:
 * - Crearea și gestionarea draft-urilor
 * - Operațiuni temporare până la confirmare
 * - Integrare cu DraftManager
 * - Suport pentru sesiuni și operațiuni complexe
 */

import { ResourceRepository } from './ResourceRepository.js';
import { draftManager } from '../infrastructure/draftManager.js';
import { db } from '../infrastructure/db.js';
import { healthRepository } from './HealthRepository.js';

export class DraftAwareResourceRepository extends ResourceRepository {
  constructor(resourceType, store = "resources") {
    super(resourceType, store);
    this.draftManager = draftManager;
  }

  // ========================================
  // HEALTH CHECK HELPERS
  // ========================================

  /**
   * Verifică dacă sistemul poate face cereri către server
   * @returns {boolean} True dacă poate face cereri
   */
  canMakeServerRequests() {
    const healthStatus = healthRepository.getCurrentStatus();
    const isDemoMode = this.isInDemoMode();
    
    // În demo mode, permite întotdeauna cererile (dar de fapt nu le face)
    if (isDemoMode) return true;
    
    // Dacă health check-ul nu a fost executat încă, permite cererile
    if (!healthStatus.lastCheck) return true;
    
    // Verifică dacă poate face cereri
    return healthStatus.canMakeRequests;
  }

  /**
   * Verifică health status-ul înainte de operațiuni
   * @param {string} operation - Numele operațiunii
   * @throws {Error} Dacă sistemul nu poate face cereri
   */
  checkHealthBeforeOperation(operation = 'operation') {
    if (!this.canMakeServerRequests()) {
      const healthStatus = healthRepository.getCurrentStatus();
      console.warn(`System is offline or server is down. ${operation} blocked.`);
      
      if (healthStatus.isOffline) {
        throw new Error('System is offline. Please check your internet connection.');
      } else if (healthStatus.isServerDown) {
        throw new Error('Server is down. Please try again later.');
      } else {
        throw new Error('System is not available. Please try again later.');
      }
    }
  }


  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Creează o nouă sesiune pentru operațiuni complexe
   * @param {string} type - Tipul sesiunii
   * @param {Object} data - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea creată
   */
  async createSession(type, data = {}) {
    try {
      // Verifică health status-ul înainte de a crea sesiunea
      this.checkHealthBeforeOperation('Create session');
      
      return await this.draftManager.createSession(type, data);
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Salvează o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @param {Object} sessionData - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea salvată
   */
  async saveSession(sessionId, sessionData) {
    try {
      // Verifică health status-ul înainte de a salva sesiunea
      this.checkHealthBeforeOperation('Save session');
      
      return await this.draftManager.saveSession(sessionId, sessionData);
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  /**
   * Obține o sesiune după ID
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Sesiunea găsită
   */
  async getSession(sessionId) {
    try {
      return await this.draftManager.getSession(sessionId);
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  /**
   * Închide o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Sesiunea închisă
   */
  async closeSession(sessionId) {
    try {
      return await this.draftManager.closeSession(sessionId);
    } catch (error) {
      console.error('Error closing session:', error);
      throw error;
    }
  }

  // ========================================
  // SESSION OPERATIONS
  // ========================================

  /**
   * Adaugă o operațiune la sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @param {string} operation - Tipul operațiunii
   * @param {Object} data - Datele operațiunii
   * @returns {Promise<Object>} Operațiunea adăugată
   */
  async addSessionOperation(sessionId, operation, data) {
    try {
      return await this.draftManager.addSessionOperation(sessionId, operation, data);
    } catch (error) {
      console.error('Error adding session operation:', error);
      throw error;
    }
  }

  /**
   * Obține toate operațiunile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Array>} Lista de operațiuni
   */
  async getSessionOperations(sessionId) {
    try {
      return await this.draftManager.getSessionOperations(sessionId);
    } catch (error) {
      console.error('Error getting session operations:', error);
      throw error;
    }
  }

  // ========================================
  // LOCAL STORE MANAGEMENT
  // ========================================

  /**
   * Adaugă un draft la store-ul local pentru preview
   * @param {Object} draft - Draft-ul de adăugat
   */
  async addDraftToLocalStore(draft) {
    try {
      const draftItem = {
        ...draft.data,
        id: draft.id,
        resourceId: draft.id,
        _isDraft: true,
        _draftId: draft.id,
        _sessionId: draft.sessionId,
        _operation: draft.operation,
        _timestamp: draft.timestamp
      };
      
      await db.table(this.store).put(draftItem);
    } catch (error) {
      console.error('Error adding draft to local store:', error);
    }
  }

  /**
   * Actualizează un draft în store-ul local
   * @param {Object} draft - Draft-ul actualizat
   */
  async updateDraftInLocalStore(draft) {
    try {
      const draftItem = {
        ...draft.data,
        id: draft.id,
        resourceId: draft.id,
        _isDraft: true,
        _draftId: draft.id,
        _sessionId: draft.sessionId,
        _operation: draft.operation,
        _timestamp: draft.timestamp
      };
      
      await db.table(this.store).put(draftItem);
    } catch (error) {
      console.error('Error updating draft in local store:', error);
    }
  }

  /**
   * Elimină un draft din store-ul local
   * @param {string} draftId - ID-ul draft-ului
   */
  async removeDraftFromLocalStore(draftId) {
    try {
      await db.table(this.store).delete(draftId);
    } catch (error) {
      console.error('Error removing draft from local store:', error);
    }
  }

  // ========================================
  // QUERY WITH DRAFTS
  // ========================================

  /**
   * Obține toate resursele incluzând draft-urile
   * @param {Object} params - Parametrii de query
   * @returns {Promise<Array>} Lista de resurse cu draft-uri
   */
  async queryWithDrafts(params = {}) {
    try {
      // Obține resursele normale
      const resources = await this.query(params);
      
      // Obține draft-urile pentru acest repository
      const drafts = await this.getAllDrafts();
      
      // Combină resursele cu draft-urile
      const combined = [...resources, ...drafts.map(draft => ({
        ...draft.data,
        id: draft.id,
        resourceId: draft.id,
        _isDraft: true,
        _draftId: draft.id,
        _sessionId: draft.sessionId,
        _operation: draft.operation,
        _timestamp: draft.timestamp
      }))];
      
      return combined;
    } catch (error) {
      console.error('Error querying with drafts:', error);
      throw error;
    }
  }

  /**
   * Obține resursele pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Array>} Lista de resurse pentru sesiune
   */
  async getResourcesForSession(sessionId) {
    try {
      const drafts = await this.draftManager.getDraftsBySession(sessionId);
      
      return drafts.map(draft => ({
        ...draft.data,
        id: draft.id,
        resourceId: draft.id,
        _isDraft: true,
        _draftId: draft.id,
        _sessionId: draft.sessionId,
        _operation: draft.operation,
        _timestamp: draft.timestamp
      }));
    } catch (error) {
      console.error('Error getting resources for session:', error);
      throw error;
    }
  }

  // ========================================
  // BATCH OPERATIONS
  // ========================================

 

  /**
   * Anulează toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelAllDraftsForSession(sessionId) {
    try {
      const drafts = await this.draftManager.getDraftsBySession(sessionId);
      const results = [];
      
      for (const draft of drafts) {
        if (draft.status === 'draft' || draft.status === 'updated') {
          try {
            const result = await this.cancelDraft(draft.id);
            results.push(result);
          } catch (error) {
            console.error(`Error cancelling draft ${draft.id}:`, error);
            results.push({ success: false, draftId: draft.id, error: error.message });
          }
        }
      }
      
      return {
        success: true,
        sessionId,
        cancelledCount: results.filter(r => r.success).length,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error cancelling all drafts for session:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Obține statistici despre draft-uri
   * @returns {Promise<Object>} Statisticile draft-urilor
   */
  async getDraftStatistics() {
    try {
      const drafts = await this.getAllDrafts();
      
      const stats = {
        totalDrafts: drafts.length,
        draftsByStatus: {},
        draftsByOperation: {},
        draftsBySession: {}
      };
      
      drafts.forEach(draft => {
        stats.draftsByStatus[draft.status] = (stats.draftsByStatus[draft.status] || 0) + 1;
        stats.draftsByOperation[draft.operation] = (stats.draftsByOperation[draft.operation] || 0) + 1;
        stats.draftsBySession[draft.sessionId] = (stats.draftsBySession[draft.sessionId] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting draft statistics:', error);
      throw error;
    }
  }

  /**
   * Curăță draft-urile vechi
   * @param {number} daysOld - Numărul de zile pentru curățare
   * @returns {Promise<number>} Numărul de draft-uri șterse
   */
  async cleanupOldDrafts(daysOld = 30) {
    try {
      return await this.draftManager.cleanupOldDrafts(daysOld);
    } catch (error) {
      console.error('Error cleaning up old drafts:', error);
      throw error;
    }
  }
}

// Export class for custom instances
export default DraftAwareResourceRepository;
