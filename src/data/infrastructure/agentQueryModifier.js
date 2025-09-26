/**
 * AgentQueryModifier - Permite agenților să modifice query-urile din aplicație
 * 
 * Acest modifier permite:
 * - Modificarea query-urilor de la agenți
 * - Aplicarea modificărilor la query-uri existente
 * - Revenirea la query-urile originale
 * - Gestionarea modificărilor temporare
 */

import { db } from './db.js';

export class AgentQueryModifier {
  constructor() {
    this.activeModifications = new Map();
    this.originalQueries = new Map();
    this.modificationListeners = new Set();
  }

  // ========================================
  // QUERY MODIFICATION
  // ========================================

  /**
   * Permite agentului să modifice query-urile
   * @param {string} sessionId - ID-ul sesiunii
   * @param {string} repositoryType - Tipul repository-ului
   * @param {Object} modifications - Modificările query-ului
   * @returns {Promise<Object>} Rezultatul modificării
   */
  async modifyQuery(sessionId, repositoryType, modifications) {
    try {
      const modificationId = `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Salvează modificarea în baza de date
      const queryModification = {
        id: modificationId,
        sessionId,
        repositoryType,
        modifications,
        timestamp: new Date().toISOString(),
        status: 'active'
      };
      
      await db.table('agentQueryModifications').add(queryModification);
      
      // Aplică modificarea
      const result = await this.applyModificationsToQuery(repositoryType, modifications);
      
      // Salvează query-ul original pentru a putea reveni la el
      if (!this.originalQueries.has(repositoryType)) {
        const originalQuery = await this.getCurrentQuery(repositoryType);
        this.originalQueries.set(repositoryType, originalQuery);
      }
      
      // Adaugă modificarea la modificările active
      this.activeModifications.set(modificationId, queryModification);
      
      // Notifică listener-ii
      this.notifyModificationListeners('query_modified', {
        sessionId,
        repositoryType,
        modificationId,
        modifications,
        result
      });
      
      return {
        success: true,
        modificationId,
        repositoryType,
        modifications,
        result,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error modifying query:', error);
      throw error;
    }
  }

  /**
   * Aplică modificări la un query existent
   * @param {string} repositoryType - Tipul repository-ului
   * @param {Object} modifications - Modificările
   * @returns {Promise<Object>} Rezultatul aplicării modificărilor
   */
  async applyModificationsToQuery(repositoryType, modifications) {
    try {
      // Obține query-ul curent
      const currentQuery = await this.getCurrentQuery(repositoryType);
      
      // Aplică modificările
      const modifiedQuery = this.mergeQueryModifications(currentQuery, modifications);
      
      // Salvează query-ul modificat
      await this.saveModifiedQuery(repositoryType, modifiedQuery);
      
      return {
        success: true,
        originalQuery: currentQuery,
        modifiedQuery,
        modifications,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error applying query modifications:', error);
      throw error;
    }
  }

  /**
   * Combină modificările cu query-ul existent
   * @param {Object} originalQuery - Query-ul original
   * @param {Object} modifications - Modificările
   * @returns {Object} Query-ul modificat
   */
  mergeQueryModifications(originalQuery, modifications) {
    const modifiedQuery = { ...originalQuery };
    
    // Aplică modificările
    Object.keys(modifications).forEach(key => {
      const modification = modifications[key];
      
      switch (modification.type) {
        case 'add_filter':
          if (!modifiedQuery.filters) modifiedQuery.filters = [];
          modifiedQuery.filters.push(modification.value);
          break;
          
        case 'remove_filter':
          if (modifiedQuery.filters) {
            modifiedQuery.filters = modifiedQuery.filters.filter(
              filter => filter !== modification.value
            );
          }
          break;
          
        case 'set_sort':
          modifiedQuery.sort = modification.value;
          break;
          
        case 'set_limit':
          modifiedQuery.limit = modification.value;
          break;
          
        case 'set_offset':
          modifiedQuery.offset = modification.value;
          break;
          
        case 'add_include':
          if (!modifiedQuery.includes) modifiedQuery.includes = [];
          modifiedQuery.includes.push(modification.value);
          break;
          
        case 'remove_include':
          if (modifiedQuery.includes) {
            modifiedQuery.includes = modifiedQuery.includes.filter(
              include => include !== modification.value
            );
          }
          break;
          
        case 'set_where':
          modifiedQuery.where = modification.value;
          break;
          
        case 'add_where':
          if (!modifiedQuery.where) modifiedQuery.where = {};
          Object.assign(modifiedQuery.where, modification.value);
          break;
          
        case 'remove_where':
          if (modifiedQuery.where && modification.value) {
            Object.keys(modification.value).forEach(key => {
              delete modifiedQuery.where[key];
            });
          }
          break;
          
        default:
          // Modificare generică
          modifiedQuery[key] = modification.value;
          break;
      }
    });
    
    return modifiedQuery;
  }

  /**
   * Obține query-ul curent pentru un repository
   * @param {string} repositoryType - Tipul repository-ului
   * @returns {Promise<Object>} Query-ul curent
   */
  async getCurrentQuery(repositoryType) {
    try {
      // Încearcă să obțină query-ul din cache
      const cachedQuery = await db.table('meta').get(`query_${repositoryType}`);
      if (cachedQuery) {
        return cachedQuery.value;
      }
      
      // Dacă nu există în cache, returnează query-ul implicit
      return this.getDefaultQuery(repositoryType);
      
    } catch (error) {
      console.error('Error getting current query:', error);
      return this.getDefaultQuery(repositoryType);
    }
  }

  /**
   * Obține query-ul implicit pentru un repository
   * @param {string} repositoryType - Tipul repository-ului
   * @returns {Object} Query-ul implicit
   */
  getDefaultQuery(repositoryType) {
    return {
      filters: [],
      sort: { createdAt: -1 },
      limit: 50,
      offset: 0,
      includes: [],
      where: {},
      repositoryType
    };
  }

  /**
   * Salvează query-ul modificat
   * @param {string} repositoryType - Tipul repository-ului
   * @param {Object} modifiedQuery - Query-ul modificat
   */
  async saveModifiedQuery(repositoryType, modifiedQuery) {
    try {
      await db.table('meta').put({
        key: `query_${repositoryType}`,
        value: modifiedQuery,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving modified query:', error);
      throw error;
    }
  }

  // ========================================
  // QUERY REVERSION
  // ========================================

  /**
   * Revine la query-ul original
   * @param {string} sessionId - ID-ul sesiunii
   * @param {string} modificationId - ID-ul modificării
   * @returns {Promise<Object>} Rezultatul revenirii
   */
  async revertQueryModification(sessionId, modificationId) {
    try {
      // Obține modificarea
      const modification = await db.table('agentQueryModifications').get(modificationId);
      if (!modification) {
        throw new Error(`Modification with ID ${modificationId} not found`);
      }
      
      // Verifică dacă modificarea aparține sesiunii
      if (modification.sessionId !== sessionId) {
        throw new Error('Modification does not belong to this session');
      }
      
      // Revine la query-ul original
      const originalQuery = this.originalQueries.get(modification.repositoryType);
      if (originalQuery) {
        await this.saveModifiedQuery(modification.repositoryType, originalQuery);
      }
      
      // Actualizează statusul modificării
      await db.table('agentQueryModifications').update(modificationId, {
        status: 'reverted',
        timestamp: new Date().toISOString()
      });
      
      // Elimină modificarea din modificările active
      this.activeModifications.delete(modificationId);
      
      // Notifică listener-ii
      this.notifyModificationListeners('query_reverted', {
        sessionId,
        modificationId,
        repositoryType: modification.repositoryType
      });
      
      return {
        success: true,
        modificationId,
        repositoryType: modification.repositoryType,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error reverting query modification:', error);
      throw error;
    }
  }

  /**
   * Revine la toate modificările pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul revenirii
   */
  async revertAllModificationsForSession(sessionId) {
    try {
      // Obține toate modificările pentru sesiune
      const modifications = await db.table('agentQueryModifications')
        .where('sessionId')
        .equals(sessionId)
        .and(mod => mod.status === 'active')
        .toArray();
      
      const results = [];
      
      for (const modification of modifications) {
        try {
          const result = await this.revertQueryModification(sessionId, modification.id);
          results.push(result);
        } catch (error) {
          console.error(`Error reverting modification ${modification.id}:`, error);
        }
      }
      
      return {
        success: true,
        sessionId,
        revertedCount: results.length,
        results,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error reverting all modifications for session:', error);
      throw error;
    }
  }

  // ========================================
  // QUERY MANAGEMENT
  // ========================================

  /**
   * Obține toate modificările pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Array>} Lista de modificări
   */
  async getModificationsForSession(sessionId) {
    try {
      return await db.table('agentQueryModifications')
        .where('sessionId')
        .equals(sessionId)
        .toArray();
    } catch (error) {
      console.error('Error getting modifications for session:', error);
      throw error;
    }
  }

  /**
   * Obține toate modificările pentru un repository
   * @param {string} repositoryType - Tipul repository-ului
   * @returns {Promise<Array>} Lista de modificări
   */
  async getModificationsForRepository(repositoryType) {
    try {
      return await db.table('agentQueryModifications')
        .where('repositoryType')
        .equals(repositoryType)
        .toArray();
    } catch (error) {
      console.error('Error getting modifications for repository:', error);
      throw error;
    }
  }

  /**
   * Obține modificările active
   * @returns {Array} Lista de modificări active
   */
  getActiveModifications() {
    return Array.from(this.activeModifications.values());
  }

  /**
   * Obține query-urile originale
   * @returns {Map} Map cu query-urile originale
   */
  getOriginalQueries() {
    return this.originalQueries;
  }

  // ========================================
  // LISTENERS & EVENTS
  // ========================================

  /**
   * Adaugă un listener pentru evenimente de modificare
   * @param {Function} callback - Callback pentru evenimente
   * @returns {Function} Funcție pentru dezabonare
   */
  addModificationListener(callback) {
    this.modificationListeners.add(callback);
    return () => this.modificationListeners.delete(callback);
  }

  /**
   * Notifică listener-ii despre evenimente
   * @param {string} event - Tipul evenimentului
   * @param {Object} data - Datele evenimentului
   */
  notifyModificationListeners(event, data) {
    this.modificationListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in modification listener:', error);
      }
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Obține statistici despre modificări
   * @returns {Promise<Object>} Statisticile modificărilor
   */
  async getModificationStatistics() {
    try {
      const modifications = await db.table('agentQueryModifications').toArray();
      
      const stats = {
        totalModifications: modifications.length,
        activeModifications: modifications.filter(m => m.status === 'active').length,
        revertedModifications: modifications.filter(m => m.status === 'reverted').length,
        modificationsByRepository: {},
        modificationsBySession: {},
        modificationsByStatus: {}
      };
      
      // Statistici după repository
      modifications.forEach(mod => {
        stats.modificationsByRepository[mod.repositoryType] = 
          (stats.modificationsByRepository[mod.repositoryType] || 0) + 1;
        stats.modificationsBySession[mod.sessionId] = 
          (stats.modificationsBySession[mod.sessionId] || 0) + 1;
        stats.modificationsByStatus[mod.status] = 
          (stats.modificationsByStatus[mod.status] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting modification statistics:', error);
      throw error;
    }
  }

  /**
   * Curăță modificările vechi
   * @param {number} daysOld - Numărul de zile pentru curățare
   * @returns {Promise<number>} Numărul de modificări șterse
   */
  async cleanupOldModifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const oldModifications = await db.table('agentQueryModifications')
        .where('timestamp')
        .below(cutoffDate.toISOString())
        .toArray();
      
      const idsToDelete = oldModifications.map(mod => mod.id);
      
      if (idsToDelete.length > 0) {
        await db.table('agentQueryModifications').bulkDelete(idsToDelete);
      }
      
      return idsToDelete.length;
    } catch (error) {
      console.error('Error cleaning up old modifications:', error);
      throw error;
    }
  }

  /**
   * Resetează toate modificările
   * @returns {Promise<boolean>} True dacă resetarea a reușit
   */
  async resetAllModifications() {
    try {
      // Revine la toate query-urile originale
      for (const [repositoryType, originalQuery] of this.originalQueries) {
        await this.saveModifiedQuery(repositoryType, originalQuery);
      }
      
      // Actualizează toate modificările ca fiind resetate
      await db.table('agentQueryModifications')
        .where('status')
        .equals('active')
        .modify({ status: 'reset', timestamp: new Date().toISOString() });
      
      // Curăță modificările active
      this.activeModifications.clear();
      
      return true;
    } catch (error) {
      console.error('Error resetting all modifications:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const agentQueryModifier = new AgentQueryModifier();

// Export class for custom instances
export default AgentQueryModifier;
