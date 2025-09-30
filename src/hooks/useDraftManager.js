/**
 * useDraftManager - Hook pentru gestionarea draft-urilor în componente
 * 
 * Acest hook permite:
 * - Crearea și gestionarea draft-urilor
 * - Gestionarea sesiunilor
 * - Operațiuni batch pe draft-uri
 * - Integrare cu UI-ul pentru draft management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { dataFacade } from '../data/DataFacade.js';
import { draftManager } from '../data/infrastructure/draftManager.js';

export function useDraftManager(resourceType, options = {}) {
  const {
    autoSave = true,
    autoSaveInterval = 30000, // 30 seconds
    onDraftChange = null,
    onSessionChange = null
  } = options;

  // State management
  const [drafts, setDrafts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);

  // Refs
  const autoSaveTimerRef = useRef(null);
  const draftListenersRef = useRef(new Set());

  // ========================================
  // DATA LOADING FUNCTIONS (defined early to avoid hoisting issues)
  // ========================================

  /**
   * Încarcă draft-urile din IndexedDB local
   */
  const loadDrafts = useCallback(async () => {
    try {
      if (!resourceType) return;

      // Accesează direct IndexedDB-ul local pentru draft-uri
      // Nu folosim dataFacade pentru a evita health check-ul
      const { db } = await import('../data/infrastructure/db.js');
      const allDrafts = await db.drafts.toArray() || [];
      
      // Filtrează draft-urile după resourceType
      const filteredDrafts = allDrafts.filter(draft => draft.resourceType === resourceType);
      setDrafts(filteredDrafts);
    } catch (err) {
      console.error('Error loading drafts:', err);
      // Don't set error for normal "no data" cases
      if (err.message && 
          !err.message.includes('not found') && 
          !err.message.includes('empty')) {
        setError(err.message);
      }
    }
  }, [resourceType]);

  /**
   * Încarcă sesiunile din IndexedDB local
   */
  const loadSessions = useCallback(async () => {
    try {
      // Sesiunile nu sunt stocate în IndexedDB în această versiune
      // Setează array gol pentru compatibilitate
      setSessions([]);
    } catch (err) {
      console.error('Error loading sessions:', err);
      // Don't set error for normal "no data" cases
      if (err.message && 
          !err.message.includes('not found') && 
          !err.message.includes('empty')) {
        setError(err.message);
      }
    }
  }, []);

  /**
   * Încarcă statisticile
   */
  const loadStatistics = useCallback(async () => {
    try {
      if (!resourceType) return;

      const repository = dataFacade.getRepository(resourceType);
      if (repository && repository.getDraftStatistics) {
        const stats = await repository.getDraftStatistics();
        setStatistics(stats);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
      // Don't set error for normal "no data" cases or health check errors
      if (err.message && 
          !err.message.includes('not found') && 
          !err.message.includes('empty') &&
          !err.message.includes('offline') &&
          !err.message.includes('server is down') &&
          !err.message.includes('not available')) {
        setError(err.message);
      }
    }
  }, [resourceType]);

  // Load initial data
  useEffect(() => {
    loadDrafts();
    loadSessions();
    loadStatistics();
  }, [loadDrafts, loadSessions, loadStatistics]);

  // Auto-save setup
  useEffect(() => {
    if (autoSave && activeSession) {
      autoSaveTimerRef.current = setInterval(() => {
        autoSaveSession();
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSave, activeSession, autoSaveInterval]);

  // Draft listeners setup
  useEffect(() => {
    const unsubscribe = draftManager.addDraftListener((event, data) => {
      handleDraftEvent(event, data);
    });

    return unsubscribe;
  }, []);

  // ========================================
  // DRAFT MANAGEMENT
  // ========================================

  /**
   * Creează un draft nou
   * @param {Object} data - Datele draft-ului
   * @param {string} operation - Tipul operațiunii
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Draft-ul creat
   */
  const createDraft = useCallback(async (data, operation = 'create', sessionId = null) => {
    try {
      setIsLoading(true);
      setError(null);

      const draft = await dataFacade.createDraft(resourceType, data, sessionId || activeSession?.sessionId);
      
      // Reload drafts
      await loadDrafts();
      
      // Notify callback
      if (onDraftChange) {
        onDraftChange('created', draft);
      }

      return draft;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [resourceType, activeSession, onDraftChange]);

  /**
   * Actualizează un draft existent
   * @param {string} draftId - ID-ul draft-ului
   * @param {Object} data - Datele actualizate
   * @returns {Promise<Object>} Draft-ul actualizat
   */
  const updateDraft = useCallback(async (draftId, data) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedDraft = await dataFacade.updateDraft(draftId, data);
      
      // Update local state
      setDrafts(prev => prev.map(draft => 
        draft.id === draftId ? updatedDraft : draft
      ));
      
      // Notify callback
      if (onDraftChange) {
        onDraftChange('updated', updatedDraft);
      }

      return updatedDraft;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onDraftChange]);

  /**
   * Confirmă un draft
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  const commitDraft = useCallback(async (draftId) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await dataFacade.commitDraft(draftId);
      
      // Reload drafts
      await loadDrafts();
      
      // Notify callback
      if (onDraftChange) {
        onDraftChange('committed', result);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onDraftChange]);

  /**
   * Anulează un draft
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<Object>} Rezultatul anulării
   */
  const cancelDraft = useCallback(async (draftId) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await dataFacade.cancelDraft(draftId);
      
      // Reload drafts
      await loadDrafts();
      
      // Notify callback
      if (onDraftChange) {
        onDraftChange('cancelled', result);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onDraftChange]);

  /**
   * Șterge un draft
   * @param {string} draftId - ID-ul draft-ului
   * @returns {Promise<boolean>} True dacă ștergerea a reușit
   */
  const deleteDraft = useCallback(async (draftId) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await dataFacade.delete('draft', draftId);
      
      // Reload drafts
      await loadDrafts();
      
      // Notify callback
      if (onDraftChange) {
        onDraftChange('deleted', { id: draftId });
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onDraftChange]);

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Creează o nouă sesiune
   * @param {string} type - Tipul sesiunii
   * @param {Object} data - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea creată
   */
  const createSession = useCallback(async (type, data = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const session = await dataFacade.createSession(type, data);
      
      // Set as active session
      setActiveSession(session);
      
      // Reload sessions
      await loadSessions();
      
      // Notify callback
      if (onSessionChange) {
        onSessionChange('created', session);
      }

      return session;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onSessionChange, loadSessions]);

  /**
   * Salvează o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @param {Object} sessionData - Datele sesiunii
   * @returns {Promise<Object>} Sesiunea salvată
   */
  const saveSession = useCallback(async (sessionId, sessionData) => {
    try {
      setIsLoading(true);
      setError(null);

      const session = await dataFacade.saveSession(sessionId, sessionData);
      
      // Update active session if it's the same
      if (activeSession && activeSession.sessionId === sessionId) {
        setActiveSession(session);
      }
      
      // Reload sessions
      await loadSessions();
      
      // Notify callback
      if (onSessionChange) {
        onSessionChange('saved', session);
      }

      return session;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, onSessionChange, loadSessions]);

  /**
   * Închide o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Sesiunea închisă
   */
  const closeSession = useCallback(async (sessionId) => {
    try {
      setIsLoading(true);
      setError(null);

      const session = await dataFacade.closeSession(sessionId);
      
      // Clear active session if it's the same
      if (activeSession && activeSession.sessionId === sessionId) {
        setActiveSession(null);
      }
      
      // Reload sessions
      await loadSessions();
      
      // Notify callback
      if (onSessionChange) {
        onSessionChange('closed', session);
      }

      return session;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, onSessionChange, loadSessions]);

  // ========================================
  // BATCH OPERATIONS
  // ========================================

  /**
   * Confirmă toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul confirmării
   */
  const commitAllDraftsForSession = useCallback(async (sessionId) => {
    try {
      setIsLoading(true);
      setError(null);

      const repository = dataFacade.getRepository(resourceType);
      if (!repository || !repository.commitAllDraftsForSession) {
        throw new Error('Repository does not support batch operations');
      }

      const result = await repository.commitAllDraftsForSession(sessionId);
      
      // Reload drafts
      await loadDrafts();
      
      // Notify callback
      if (onDraftChange) {
        onDraftChange('all_committed', result);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [resourceType, onDraftChange]);

  /**
   * Anulează toate draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Promise<Object>} Rezultatul anulării
   */
  const cancelAllDraftsForSession = useCallback(async (sessionId) => {
    try {
      setIsLoading(true);
      setError(null);

      const repository = dataFacade.getRepository(resourceType);
      if (!repository || !repository.cancelAllDraftsForSession) {
        throw new Error('Repository does not support batch operations');
      }

      const result = await repository.cancelAllDraftsForSession(sessionId);
      
      // Reload drafts
      await loadDrafts();
      
      // Notify callback
      if (onDraftChange) {
        onDraftChange('all_cancelled', result);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [resourceType, onDraftChange]);

  // ========================================
  // DATA LOADING
  // ========================================

  // ========================================
  // AUTO-SAVE
  // ========================================

  /**
   * Salvează automat sesiunea
   */
  const autoSaveSession = useCallback(async () => {
    try {
      if (!activeSession) return;

      await saveSession(activeSession.sessionId, activeSession.data);
    } catch (err) {
      console.error('Error auto-saving session:', err);
    }
  }, [activeSession, saveSession]);

  // ========================================
  // EVENT HANDLING
  // ========================================

  /**
   * Gestionează evenimentele de draft
   * @param {string} event - Tipul evenimentului
   * @param {Object} data - Datele evenimentului
   */
  const handleDraftEvent = useCallback((event, data) => {
    switch (event) {
      case 'draft_created':
        setDrafts(prev => [...prev, data]);
        break;
      case 'draft_updated':
        setDrafts(prev => prev.map(draft => 
          draft.id === data.id ? data : draft
        ));
        break;
      case 'draft_committed':
      case 'draft_cancelled':
      case 'draft_deleted':
        setDrafts(prev => prev.filter(draft => draft.id !== data.id));
        break;
    }
  }, []);

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Obține draft-urile pentru o sesiune
   * @param {string} sessionId - ID-ul sesiunii
   * @returns {Array} Lista de draft-uri
   */
  const getDraftsForSession = useCallback((sessionId) => {
    return drafts.filter(draft => draft.sessionId === sessionId);
  }, [drafts]);

  /**
   * Obține draft-urile active
   * @returns {Array} Lista de draft-uri active
   */
  const getActiveDrafts = useCallback(() => {
    return drafts.filter(draft => draft.status === 'draft' || draft.status === 'updated');
  }, [drafts]);

  /**
   * Obține draft-urile pentru o operațiune
   * @param {string} operation - Tipul operațiunii
   * @returns {Array} Lista de draft-uri
   */
  const getDraftsByOperation = useCallback((operation) => {
    return drafts.filter(draft => draft.operation === operation);
  }, [drafts]);

  /**
   * Curăță draft-urile vechi
   * @param {number} daysOld - Numărul de zile pentru curățare
   * @returns {Promise<number>} Numărul de draft-uri șterse
   */
  const cleanupOldDrafts = useCallback(async (daysOld = 30) => {
    try {
      if (!resourceType) return 0;

      const repository = dataFacade.getRepository(resourceType);
      if (!repository || !repository.cleanupOldDrafts) {
        return 0;
      }

      const count = await repository.cleanupOldDrafts(daysOld);
      
      // Reload drafts
      await loadDrafts();
      
      return count;
    } catch (err) {
      console.error('Error cleaning up old drafts:', err);
      throw err;
    }
  }, [resourceType]);

  // ========================================
  // RETURN HOOK INTERFACE
  // ========================================

  return {
    // State
    drafts,
    sessions,
    activeSession,
    isLoading,
    error,
    statistics,
    
    // Draft operations
    createDraft,
    updateDraft,
    commitDraft,
    cancelDraft,
    deleteDraft,
    
    // Session operations
    createSession,
    saveSession,
    closeSession,
    
    // Batch operations
    commitAllDraftsForSession,
    cancelAllDraftsForSession,
    
    // Data loading
    loadDrafts,
    loadSessions,
    loadStatistics,
    
    // Utility methods
    getDraftsForSession,
    getActiveDrafts,
    getDraftsByOperation,
    cleanupOldDrafts
  };
}

// Export default
export default useDraftManager;
