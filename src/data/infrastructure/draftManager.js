/**
 * DraftManager - Gestionează draft-urile și sesiunile pentru operațiuni temporare
 * 
 * Acest manager permite:
 * - Crearea și gestionarea draft-urilor temporare
 * - Salvarea sesiunilor pentru a te întoarce la ele ulterior
 * - Adăugarea operațiunilor în timpul sesiunii
 * - Confirmarea sau anularea draft-urilor
 */

import { db } from './db.js';

export class DraftManager {
  constructor() {
    this.activeSessions = new Map();
    this.draftListeners = new Set();
  }

  // ========================================
  // DRAFT MANAGEMENT
  // ========================================

  /**
   * Creează un draft pentru o operațiune temporară
   * @param {string} resourceType - Tipul de resursă
   * @param {Object} initialData - Datele inițiale
   * @param {string} operation - Tipul operațiunii (create, update, delete)
   * @param {string} sessionId - ID-ul sesiunii (opțional)
   * @returns {Promise<Object>} Draft-ul creat
   */
  async createDraft(resourceType, initialData, operation = 'create', sessionId = null) {
    try {
      const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const draft = {
        id: draftId,
        sessionId: session,
        resourceType,
        data: initialData,
        operation,
        timestamp: new Date().toISOString(),
        status: 'draft',
        parentId: null
      };

      await db.table('drafts').add(draft);
      
      // Notifică listener-ii
      this.notifyDraftListeners('draft_created', draft);
      
      return draft;
    } catch (error) {
      console.error('Error creating draft:', error);
      throw error;
    }
  }

  /**
   * Actualizează un draft existent
   * @param {string} draftId - ID-ul draft-ului
   * @param {Object} newData - Datele actualizate
   * @returns {Promise<Object>} Draft-ul actualizat
   */
  async updateDraft(draftId, newData) {
    try {
      const draft = await db.table('drafts').get(draftId);
      if (!draft) {
        throw new Error(`Draft with ID ${draftId} not found`);
      }

      const updatedDraft = {
        ...draft,
        data: { ...draft.data, ...newData },
        timestamp: new Date().toISOString(),
        status: 'updated'
      };

      await db.table('drafts').put(updatedDraft);
      
      // Notifică listener-ii
      this.notifyDraftListeners('draft_updated', updatedDraft);
      
      return updatedDraft;
    } catch (error) {
      console.error('Error updating draft:', error);
      throw error;
    }
  }

  /**
   * Obține un draft după ID
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Draft-ul găsit
   */
  async getDraft(draftId) {
    try {
      return await db.table('drafts').get(draftId);
    } catch (error) {
      console.error('Error getting draft:', error);
      throw error;
    }
  }

  /**
   * Obține toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Array>} Lista de draft-uri
   */
  async getDraftsBySession(sessionId) {
    try {
      return await db.table('drafts')
        .where('sessionId')
        .equals(sessionId)
        .toArray();
    } catch (error) {
      console.error('Error getting drafts by session:', error);
      throw error;
    }
  }

  /**
   * Obține toate draft-urile pentru un tip de resursă
   * @param {string} resourceType - Tipul de resursă
   * @returns {Promise<Array>} Lista de draft-uri
   */
  async getDraftsByResourceType(resourceType) {
    try {
      return await db.table('drafts')
        .where('resourceType')
        .equals(resourceType)
        .toArray();
    } catch (error) {
      console.error('Error getting drafts by resource type:', error);
      throw error;
    }
  }

  /**
   * Confirmă un draft (devine ireversibil)
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  async commitDraft(draftId) {
    try {
      const draft = await db.table('drafts').get(draftId);
      if (!draft) {
        throw new Error(`Draft with ID ${draftId} not found`);
      }

      const committedDraft = {
        ...draft,
        status: 'committed',
        timestamp: new Date().toISOString()
      };

      await db.table('drafts').put(committedDraft);
      
      // Notifică listener-ii
      this.notifyDraftListeners('draft_committed', committedDraft);
      
      return committedDraft;
    } catch (error) {
      console.error('Error committing draft:', error);
      throw error;
    }
  }

  /**
   * Anulează un draft (reversibil)
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul anulării
   */
  async cancelDraft(draftId) {
    try {
      const draft = await db.table('drafts').get(draftId);
      if (!draft) {
        throw new Error(`Draft with ID ${draftId} not found`);
      }

      const cancelledDraft = {
        ...draft,
        status: 'cancelled',
        timestamp: new Date().toISOString()
      };

      await db.table('drafts').put(cancelledDraft);
      
      // Notifică listener-ii
      this.notifyDraftListeners('draft_cancelled', cancelledDraft);
      
      return cancelledDraft;
    } catch (error) {
      console.error('Error cancelling draft:', error);
      throw error;
    }
  }

  /**
   * Șterge un draft
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<boolean>} True dacă ștergerea a reușit
   */
  async deleteDraft(draftId) {
    try {
      await db.table('drafts').delete(draftId);
      
      // Notifică listener-ii
      this.notifyDraftListeners('draft_deleted', { id: draftId });
      
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Creează o nouă sesiune
   * @param {string} type - Tipul sesiunii
   * @param {Object} data - Datele sesiunii
   * @param {string} parentId - ID-ul părinte (opțional)
   * @returns {Promise<Object>} Sesiunea creată
   */
  async createSession(type, data = {}, parentId = null) {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session = {
        id: sessionId,
        sessionId,
        type,
        data,
        timestamp: new Date().toISOString(),
        status: 'active',
        parentId
      };

      await db.table('sessions').add(session);
      
      // Adaugă sesiunea la sesiunile active
      this.activeSessions.set(sessionId, session);
      
      return session;
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
      const session = await db.table('sessions').get(sessionId);
      if (!session) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      const updatedSession = {
        ...session,
        data: { ...session.data, ...sessionData },
        timestamp: new Date().toISOString(),
        status: 'saved'
      };

      await db.table('sessions').put(updatedSession);
      
      return updatedSession;
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
      return await db.table('sessions').get(sessionId);
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  /**
   * Obține toate sesiunile active
   * @returns {Promise<Array>} Lista de sesiuni active
   */
  async getActiveSessions() {
    try {
      return await db.table('sessions')
        .where('status')
        .equals('active')
        .toArray();
    } catch (error) {
      console.error('Error getting active sessions:', error);
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
      const session = await db.table('sessions').get(sessionId);
      if (!session) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      const closedSession = {
        ...session,
        status: 'closed',
        timestamp: new Date().toISOString()
      };

      await db.table('sessions').put(closedSession);
      
      // Elimină sesiunea din sesiunile active
      this.activeSessions.delete(sessionId);
      
      return closedSession;
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
      const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const sessionOperation = {
        id: operationId,
        sessionId,
        operation,
        data,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      await db.table('sessionOperations').add(sessionOperation);
      
      return sessionOperation;
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
      return await db.table('sessionOperations')
        .where('sessionId')
        .equals(sessionId)
        .toArray();
    } catch (error) {
      console.error('Error getting session operations:', error);
      throw error;
    }
  }

  // ========================================
  // LISTENERS & EVENTS
  // ========================================

  /**
   * Adaugă un listener pentru evenimente de draft
   * @param {Function} callback - Callback pentru evenimente
   * @returns {Function} Funcție pentru dezabonare
   */
  addDraftListener(callback) {
    this.draftListeners.add(callback);
    return () => this.draftListeners.delete(callback);
  }

  /**
   * Notifică listener-ii despre evenimente
   * @param {string} event - Tipul evenimentului
   * @param {Object} data - Datele evenimentului
   */
  notifyDraftListeners(event, data) {
    this.draftListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in draft listener:', error);
      }
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Obține toate draft-urile
   * @returns {Promise<Array>} Lista de draft-uri
   */
  async getAllDrafts() {
    try {
      return await db.table('drafts').toArray();
    } catch (error) {
      console.error('Error getting all drafts:', error);
      throw error;
    }
  }

  /**
   * Obține toate sesiunile
   * @returns {Promise<Array>} Lista de sesiuni
   */
  async getAllSessions() {
    try {
      return await db.table('sessions').toArray();
    } catch (error) {
      console.error('Error getting all sessions:', error);
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
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const oldDrafts = await db.table('drafts')
        .where('timestamp')
        .below(cutoffDate.toISOString())
        .toArray();
      
      const idsToDelete = oldDrafts.map(draft => draft.id);
      
      if (idsToDelete.length > 0) {
        await db.table('drafts').bulkDelete(idsToDelete);
      }
      
      return idsToDelete.length;
    } catch (error) {
      console.error('Error cleaning up old drafts:', error);
      throw error;
    }
  }

  /**
   * Obține statistici despre draft-uri
   * @returns {Promise<Object>} Statisticile draft-urilor
   */
  async getDraftStatistics() {
    try {
      const drafts = await this.getAllDrafts();
      const sessions = await this.getAllSessions();
      
      const stats = {
        totalDrafts: drafts.length,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.status === 'active').length,
        draftsByStatus: {},
        draftsByResourceType: {},
        sessionsByType: {}
      };
      
      // Statistici draft-uri după status
      drafts.forEach(draft => {
        stats.draftsByStatus[draft.status] = (stats.draftsByStatus[draft.status] || 0) + 1;
        stats.draftsByResourceType[draft.resourceType] = (stats.draftsByResourceType[draft.resourceType] || 0) + 1;
      });
      
      // Statistici sesiuni după tip
      sessions.forEach(session => {
        stats.sessionsByType[session.type] = (stats.sessionsByType[session.type] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting draft statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const draftManager = new DraftManager();

// Export class for custom instances
export default DraftManager;
