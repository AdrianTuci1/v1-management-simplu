/**
 * Session Storage Utility
 * Handles localStorage persistence for AI Assistant sessions with per-day grouping
 * Storage key format: ${businessId}:${userId}:${YYYY-MM-DD}
 */

// Get today's date in YYYY-MM-DD format
export const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate storage key for session
export const getSessionStorageKey = (businessId, userId, date = null) => {
  const dateKey = date || getTodayKey();
  return `ai_session:${businessId}:${userId}:${dateKey}`;
};

// Save session ID to localStorage
export const saveSessionToStorage = (businessId, userId, sessionId, date = null) => {
  if (!businessId || !userId || !sessionId) {
    console.warn('[SessionStorage] Cannot save session - missing required parameters', {
      businessId,
      userId,
      sessionId
    });
    return false;
  }

  try {
    const key = getSessionStorageKey(businessId, userId, date);
    const data = {
      sessionId,
      businessId,
      userId,
      date: date || getTodayKey(),
      savedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(data));
    
    console.log('[SessionStorage] Session saved to localStorage', {
      key,
      sessionId,
      date: data.date
    });
    
    return true;
  } catch (error) {
    console.error('[SessionStorage] Failed to save session to localStorage', error);
    return false;
  }
};

// Load session ID from localStorage
export const loadSessionFromStorage = (businessId, userId, date = null) => {
  if (!businessId || !userId) {
    console.warn('[SessionStorage] Cannot load session - missing required parameters', {
      businessId,
      userId
    });
    return null;
  }

  try {
    const key = getSessionStorageKey(businessId, userId, date);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      console.log('[SessionStorage] No stored session found for key', { key });
      return null;
    }
    
    const data = JSON.parse(stored);
    
    // Update last accessed time
    data.lastAccessed = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(data));
    
    console.log('[SessionStorage] Session loaded from localStorage', {
      key,
      sessionId: data.sessionId,
      date: data.date,
      savedAt: data.savedAt
    });
    
    return data.sessionId;
  } catch (error) {
    console.error('[SessionStorage] Failed to load session from localStorage', error);
    return null;
  }
};

// Remove session from localStorage
export const removeSessionFromStorage = (businessId, userId, date = null) => {
  if (!businessId || !userId) {
    console.warn('[SessionStorage] Cannot remove session - missing required parameters', {
      businessId,
      userId
    });
    return false;
  }

  try {
    const key = getSessionStorageKey(businessId, userId, date);
    localStorage.removeItem(key);
    
    console.log('[SessionStorage] Session removed from localStorage', { key });
    
    return true;
  } catch (error) {
    console.error('[SessionStorage] Failed to remove session from localStorage', error);
    return false;
  }
};

// Get all stored sessions for a user
export const getAllUserSessions = (businessId, userId) => {
  if (!businessId || !userId) {
    return [];
  }

  try {
    const prefix = `ai_session:${businessId}:${userId}:`;
    const sessions = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(prefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          sessions.push(data);
        } catch (parseError) {
          console.warn('[SessionStorage] Failed to parse stored session', { key, parseError });
        }
      }
    }
    
    // Sort by date descending (most recent first)
    sessions.sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      return 0;
    });
    
    console.log('[SessionStorage] Found stored sessions', {
      count: sessions.length,
      businessId,
      userId
    });
    
    return sessions;
  } catch (error) {
    console.error('[SessionStorage] Failed to get all user sessions', error);
    return [];
  }
};

// Clean up old sessions (older than N days)
export const cleanupOldSessions = (businessId, userId, daysToKeep = 30) => {
  if (!businessId || !userId) {
    return 0;
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffKey = cutoffDate.toISOString().split('T')[0];
    
    const prefix = `ai_session:${businessId}:${userId}:`;
    let removedCount = 0;
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(prefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          
          // Remove if older than cutoff date
          if (data.date < cutoffKey) {
            localStorage.removeItem(key);
            removedCount++;
          }
        } catch (parseError) {
          console.warn('[SessionStorage] Failed to parse stored session during cleanup', { key, parseError });
        }
      }
    }
    
    if (removedCount > 0) {
      console.log('[SessionStorage] Cleaned up old sessions', {
        removedCount,
        daysToKeep,
        cutoffDate: cutoffKey
      });
    }
    
    return removedCount;
  } catch (error) {
    console.error('[SessionStorage] Failed to cleanup old sessions', error);
    return 0;
  }
};

// Check if there's a session stored for today
export const hasTodaySession = (businessId, userId) => {
  const sessionId = loadSessionFromStorage(businessId, userId);
  return !!sessionId;
};

// Get stored session info without updating last accessed
export const getSessionInfo = (businessId, userId, date = null) => {
  if (!businessId || !userId) {
    return null;
  }

  try {
    const key = getSessionStorageKey(businessId, userId, date);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('[SessionStorage] Failed to get session info', error);
    return null;
  }
};

